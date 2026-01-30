"""
Chat WebSocket route.

Handles real-time communication with the Donna agent.
"""

import asyncio
import json
import logging
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

from claude_agent_sdk import (
    AssistantMessage,
    UserMessage,
    TextBlock,
    ToolUseBlock,
    ToolResultBlock,
    ResultMessage,
)

from donna_life_os.core import DonnaAgent, PermissionRequest
from donna_life_os.web.auth.middleware import verify_websocket_auth
from donna_life_os.web.auth.config import get_auth_config


router = APIRouter(tags=["chat"])


class WebSocketPermissionHandler:
    """
    Handles permission requests via WebSocket.
    
    When the agent needs permission, sends a request to the client
    and waits for a response.
    """
    
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self._pending_permission: asyncio.Future | None = None
    
    async def handle_permission(self, request: PermissionRequest) -> bool:
        """
        Send permission request to client and wait for response.

        IMPORTANT: This method receives WebSocket messages directly because
        the main message loop is blocked waiting for process_agent_response()
        to complete. We can't rely on resolve_permission() being called from
        the main loop.
        """
        # Send permission request
        await self.websocket.send_json({
            "type": "permission_request",
            "tool": request.tool_name,
            "input": request.tool_input,
        })

        try:
            # Wait for permission response directly from WebSocket
            # The main loop is blocked, so we must receive here
            while True:
                data = await asyncio.wait_for(
                    self.websocket.receive_json(),
                    timeout=300
                )

                if data.get("type") == "permission_response":
                    return data.get("allowed", False)
                # Ignore other message types while waiting for permission
        except asyncio.TimeoutError:
            return False

    def resolve_permission(self, allowed: bool) -> None:
        """
        Resolve a pending permission request.

        NOTE: This method is kept for API compatibility but is no longer
        used since handle_permission() now receives messages directly.
        """
        if self._pending_permission and not self._pending_permission.done():
            self._pending_permission.set_result(allowed)


async def send_message_event(websocket: WebSocket, event_type: str, data: Any) -> None:
    """Send a typed event to the WebSocket client."""
    await websocket.send_json({"type": event_type, **data})


async def process_agent_response(
    donna: DonnaAgent,
    websocket: WebSocket,
    dev_mode: bool = True,
) -> dict | None:
    """
    Process streaming responses from the agent and send to WebSocket.
    
    Args:
        donna: The DonnaAgent instance
        websocket: WebSocket connection
        dev_mode: If True, send thinking and tool events
        
    Returns:
        Session stats from ResultMessage, or None
    """
    result_stats = None
    message_count = 0

    logger.info("[CHAT] Starting to receive response from agent")
    async for message in donna.receive_response():
        message_count += 1
        logger.info(f"[CHAT] Received message {message_count}: {type(message).__name__}")
        if isinstance(message, AssistantMessage):
            parent_id = getattr(message, "parent_tool_use_id", None)
            for block in message.content:
                # Handle thinking/reasoning blocks
                if hasattr(block, "thinking") and block.thinking:
                    if dev_mode:
                        await send_message_event(websocket, "thinking", {
                            "content": block.thinking
                        })

                # Handle tool use blocks
                elif isinstance(block, ToolUseBlock):
                    if dev_mode:
                        await send_message_event(websocket, "tool_use", {
                            "name": block.name,
                            "input": block.input,
                            "toolId": block.id,
                            "parentToolUseId": parent_id,
                        })

                # Handle text blocks (the actual response)
                elif isinstance(block, TextBlock):
                    # Filter empty text and SDK artifact "(no content)" placeholder
                    if block.text and block.text.strip() and block.text.strip() != "(no content)":
                        await send_message_event(websocket, "text", {
                            "content": block.text
                        })

        # Handle tool results from UserMessage
        elif isinstance(message, UserMessage):
            parent_id = getattr(message, "parent_tool_use_id", None)
            for block in message.content:
                if isinstance(block, ToolResultBlock):
                    if dev_mode:
                        content = block.content
                        if isinstance(content, list):
                            texts = []
                            for item in content:
                                if isinstance(item, dict) and "text" in item:
                                    texts.append(item["text"])
                                else:
                                    texts.append(str(item))
                            content = "\n".join(texts)

                        await send_message_event(websocket, "tool_result", {
                            "content": str(content) if content else "",
                            "isError": getattr(block, "is_error", False),
                            "toolUseId": getattr(block, "tool_use_id", None),
                            "parentToolUseId": parent_id,
                        })
        
        # Capture result message for summary
        elif isinstance(message, ResultMessage):
            result_stats = {
                "turns": message.num_turns,
                "duration_ms": message.duration_ms,
                "cost_usd": message.total_cost_usd,
            }
    
    logger.info(f"[CHAT] Finished receiving response, total messages: {message_count}")
    return result_stats


@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for chat with the Donna agent.

    Query Parameters:
    - timezone: IANA timezone string (e.g., "America/New_York")

    Protocol:
    - Client sends: {"type": "message", "content": "...", "devMode": bool}
    - Client sends: {"type": "permission_response", "allowed": bool}
    - Server sends: {"type": "text", "content": "..."}
    - Server sends: {"type": "thinking", "content": "..."} (dev mode)
    - Server sends: {"type": "tool_use", "name": "...", "input": {...}} (dev mode)
    - Server sends: {"type": "tool_result", "content": "...", "isError": bool} (dev mode)
    - Server sends: {"type": "permission_request", "tool": "...", "input": {...}}
    - Server sends: {"type": "session_end", "stats": {...}}
    - Server sends: {"type": "error", "message": "..."}
    """
    # Check authentication before accepting the connection
    auth_config = get_auth_config()
    if auth_config.enabled:
        user = await verify_websocket_auth(websocket)
        if not user:
            # Accept then close to avoid noisy 403 logs
            await websocket.accept()
            await websocket.close(code=4001, reason="Authentication required")
            return

    # Extract timezone from query parameters
    client_timezone = websocket.query_params.get("timezone")

    await websocket.accept()

    permission_handler = WebSocketPermissionHandler(websocket)
    donna: DonnaAgent | None = None
    dev_mode = True

    try:
        # Initialize the agent with client timezone
        donna = DonnaAgent(
            on_permission_request=permission_handler.handle_permission,
            client_timezone=client_timezone,
        )
        await donna.__aenter__()
        
        # Send the automatic greeting
        logger.info("[CHAT] Sending greeting_start, processing greeting response")
        await send_message_event(websocket, "greeting_start", {})
        stats = await process_agent_response(donna, websocket, dev_mode)
        logger.info(f"[CHAT] Greeting completed, stats: {stats}")
        if stats:
            await send_message_event(websocket, "session_end", {"stats": stats})

        logger.info("[CHAT] Entering main message loop")
        # Main message loop
        while True:
            try:
                data = await websocket.receive_json()
            except json.JSONDecodeError:
                await send_message_event(websocket, "error", {
                    "message": "Invalid JSON"
                })
                continue
            
            msg_type = data.get("type")
            
            if msg_type == "message":
                content = data.get("content", "").strip()
                dev_mode = data.get("devMode", True)

                if not content:
                    continue

                # Send user message to agent and process response
                logger.info(f"[CHAT] Sending message to agent: {content[:50]}...")
                try:
                    await donna.send_message(content)
                    logger.info("[CHAT] send_message completed successfully")

                    # Process and stream response
                    logger.info("[CHAT] Starting process_agent_response")
                    stats = await process_agent_response(donna, websocket, dev_mode)
                    logger.info(f"[CHAT] process_agent_response completed, stats: {stats}")

                    if stats:
                        await send_message_event(websocket, "session_end", {"stats": stats})
                except Exception as e:
                    logger.error(f"[CHAT] Agent error during message handling: {e}")
                    await send_message_event(websocket, "error", {
                        "message": f"Agent error: {e}"
                    })
                    # Agent subprocess likely died — break out so finally block cleans up
                    break
            
            elif msg_type == "permission_response":
                allowed = data.get("allowed", False)
                permission_handler.resolve_permission(allowed)
            
            elif msg_type == "disconnect":
                break
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await send_message_event(websocket, "error", {
                "message": str(e)
            })
        except Exception:
            pass
    finally:
        if donna:
            try:
                await donna.__aexit__(None, None, None)
            except Exception:
                pass
