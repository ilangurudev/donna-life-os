"""
Chat WebSocket route.

Handles real-time communication with the Donna agent.
"""

import asyncio
import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from claude_agent_sdk import (
    AssistantMessage,
    TextBlock,
    ToolUseBlock,
    ToolResultBlock,
    ResultMessage,
)

# Import core - handle both package and direct execution
try:
    from ...core import DonnaAgent, PermissionRequest
    from ..auth.middleware import verify_websocket_auth
    from ..auth.config import get_auth_config
except ImportError:
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from core import DonnaAgent, PermissionRequest
    from web.auth.middleware import verify_websocket_auth
    from web.auth.config import get_auth_config


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
    
    async for message in donna.receive_response():
        if isinstance(message, AssistantMessage):
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
                        })
                
                # Handle tool result blocks
                elif isinstance(block, ToolResultBlock):
                    if dev_mode:
                        # Extract text content from tool result
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
                            "isError": block.is_error,
                        })
                
                # Handle text blocks (the actual response)
                elif isinstance(block, TextBlock):
                    await send_message_event(websocket, "text", {
                        "content": block.text
                    })
        
        # Capture result message for summary
        elif isinstance(message, ResultMessage):
            result_stats = {
                "turns": message.num_turns,
                "duration_ms": message.duration_ms,
                "cost_usd": message.total_cost_usd,
            }
    
    return result_stats


@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for chat with the Donna agent.
    
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
    
    await websocket.accept()
    
    permission_handler = WebSocketPermissionHandler(websocket)
    donna: DonnaAgent | None = None
    dev_mode = True
    
    try:
        # Initialize the agent
        donna = DonnaAgent(on_permission_request=permission_handler.handle_permission)
        await donna.__aenter__()
        
        # Send the automatic greeting
        await send_message_event(websocket, "greeting_start", {})
        stats = await process_agent_response(donna, websocket, dev_mode)
        if stats:
            await send_message_event(websocket, "session_end", {"stats": stats})
        
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
                
                # Send user message to agent
                await donna.send_message(content)
                
                # Process and stream response
                stats = await process_agent_response(donna, websocket, dev_mode)
                if stats:
                    await send_message_event(websocket, "session_end", {"stats": stats})
            
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
