"""
Donna Life OS - Core Agent Module

Reusable agent logic that can be used with any interface (CLI, web, etc.).
Uses async event-based permission handling for flexibility.
"""

import asyncio
import json
import logging
import shutil
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import AsyncGenerator, Callable, Awaitable, Dict, Any
from zoneinfo import ZoneInfo
import yaml

logger = logging.getLogger(__name__)

from tzlocal import get_localzone

from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    HookMatcher,
    AssistantMessage,
    ResultMessage,
    TextBlock,
    ToolUseBlock,
    ToolResultBlock,
    PermissionResultAllow,
    PermissionResultDeny,
)

from donna_life_os.config import (
    MODEL,
    MAX_THINKING_TOKENS,
    ALLOWED_TOOLS,
    AUTO_ALLOWED_TOOLS,
    DONNA_DATA_DIR,
    CURRENT_CONTEXT_FILE,
    USER_PREFERENCES_FILE,
    MAX_BUDGET_USD,
    MAX_TURNS,
    LOG_DIR,
)


class ConversationLogger:
    """Streams conversation log entries to a JSONL file as they happen."""

    def __init__(self, log_dir: Path):
        self.log_dir = log_dir
        self.log_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = log_dir / f"{timestamp}.jsonl"

    def log(self, entry_type: str, data: dict):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": entry_type,
            **data,
        }
        with open(self.log_file, "a") as f:
            f.write(json.dumps(entry, default=str) + "\n")

    def log_message(self, message):
        """Log an AssistantMessage or ResultMessage from the SDK."""
        if isinstance(message, AssistantMessage):
            blocks = []
            for block in message.content:
                if isinstance(block, TextBlock):
                    if block.text and block.text.strip() and block.text.strip() != "(no content)":
                        blocks.append({"type": "text", "text": block.text})
                elif hasattr(block, "thinking") and block.thinking:
                    blocks.append({"type": "thinking", "thinking": block.thinking})
                elif isinstance(block, ToolUseBlock):
                    blocks.append({
                        "type": "tool_use",
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    })
                elif isinstance(block, ToolResultBlock):
                    blocks.append({
                        "type": "tool_result",
                        "tool_use_id": block.tool_use_id,
                        "content": block.content,
                        "is_error": block.is_error,
                    })
            if blocks:
                self.log("assistant_message", {"content": blocks})
        elif isinstance(message, ResultMessage):
            self.log("result", {
                "num_turns": getattr(message, "num_turns", None),
                "duration_ms": getattr(message, "duration_ms", None),
                "total_cost_usd": getattr(message, "total_cost_usd", None),
                "usage": getattr(message, "usage", None),
            })


async def nudge_context_updater(input_data, tool_use_id, context):
    """PostToolUse hook: nudge Donna to run the context-updater agent after file operations."""
    return {
        "systemMessage": (
            "A file was just read or modified. If you haven't already, spawn the "
            "context-updater agent in the background to keep current_context.md "
            "up to date with what the user is focused on."
        ),
    }


def load_current_context() -> str:
    """
    Load the current context file contents.
    
    Returns:
        Full contents of current_context.md, or empty string if file doesn't exist.
    """
    if not CURRENT_CONTEXT_FILE.exists():
        return ""
    return CURRENT_CONTEXT_FILE.read_text()


def generate_greeting_prompt() -> str:
    """
    Generate a prompt for the agent to create a natural greeting.
    
    For new users, triggers the onboarding skill.
    For returning users, generates a contextual greeting.
    
    Returns:
        A system prompt that asks the agent to greet the user naturally.
    """
    # Check if this is a new user - trigger onboarding skill
    if is_new_user():
        setup_donna_data_directory()  # Ensure data folder exists before onboarding
        return """[SYSTEM - ONBOARDING]
This is a new user. The ~/donna-data folder structure has been initialized.
Use the new-user-onboarding skill to guide them through a natural introduction. I am now going to invoke the new-user-onboarding skill."""
    
    # Returning user - normal greeting
    user_name = get_user_name()
    
    return f"""[SYSTEM - GREETING]
Start this conversation by greeting {user_name} naturally and asking what's on their mind.

Keep it conversational and brief - just a friendly opener that acknowledges their context.
You can suggest a few things they might want to talk about based on their active context
(from current_context.md, already loaded in your system prompt), or offer to do a check-in,
capture something new, or just chat. Make it feel natural, not like a menu. One or two sentences max.

Don't use bullet points or numbered lists - just speak naturally."""


def load_user_info_and_preferences() -> Dict[str, Any]:
    """
    Load user info and preferences from the preferences file.
    
    Returns:
        Dictionary of user info and preferences, or empty dict if file doesn't exist.
    """
    if not USER_PREFERENCES_FILE.exists():
        return {}
    
    content = USER_PREFERENCES_FILE.read_text()
    
    # Parse YAML frontmatter
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            try:
                return yaml.safe_load(parts[1]) or {}
            except yaml.YAMLError:
                return {}
    return {}


def get_user_name() -> str:
    """Get the user's name from preferences, or 'there' as fallback."""
    prefs = load_user_info_and_preferences()
    return prefs.get("name", "there")


def get_user_timezone() -> str | None:
    """Get the user's timezone from preferences, if set."""
    prefs = load_user_info_and_preferences()
    tz = prefs.get("timezone")
    if tz and tz != "TBD":
        return tz
    return None


def get_effective_timezone(client_timezone: str | None = None) -> ZoneInfo:
    """
    Get the effective timezone to use, with fallback chain:
    1. Client-provided timezone (from browser)
    2. User's stored timezone preference
    3. System local timezone

    Args:
        client_timezone: IANA timezone string from client (e.g., "America/New_York")

    Returns:
        ZoneInfo object for the effective timezone
    """
    # Try client timezone first
    if client_timezone:
        try:
            return ZoneInfo(client_timezone)
        except Exception:
            pass

    # Try user's stored preference
    user_tz = get_user_timezone()
    if user_tz:
        try:
            return ZoneInfo(user_tz)
        except Exception:
            pass

    # Fall back to system timezone
    return get_localzone()


def generate_date_context(timezone: ZoneInfo | None = None) -> str:
    """
    Generate a date/time context string for the system prompt.

    Includes:
    - Current date and time with timezone
    - Next 7 days with day names
    - Reference points (1 week, 2 weeks, end of month)

    Args:
        timezone: Timezone to use. If None, uses system timezone.

    Returns:
        Formatted date context string for injection into system prompt.
    """
    tz = timezone or get_localzone()
    now = datetime.now(tz)

    # Format current time
    day_name = now.strftime("%A")
    date_readable = now.strftime("%B %d, %Y").replace(" 0", " ")  # Remove leading zero
    time_readable = now.strftime("%I:%M %p").lstrip("0")  # Remove leading zero from hour
    tz_abbrev = now.strftime("%Z")
    tz_name = str(tz)
    iso_timestamp = now.isoformat()

    lines = [
        "═══ DATE & TIME CONTEXT ═══",
        f"Today: {day_name}, {date_readable}",
        f"Current time: {time_readable} {tz_abbrev} ({tz_name}) [{iso_timestamp}]",
        "",
        "─── This Week ───",
    ]

    # Generate next 7 days
    for i in range(1, 8):
        future_date = now + timedelta(days=i)
        future_day = future_date.strftime("%A")
        future_date_readable = future_date.strftime("%B %d, %Y").replace(" 0", " ")
        future_iso = future_date.strftime("%Y-%m-%d")

        if i == 1:
            label = f"Tomorrow ({future_day[:3]})"
        else:
            # Prefix with "Next" if it's past this week
            label = future_day
            if i > (6 - now.weekday()):  # Past this week's same day
                label = f"Next {future_day}"

        lines.append(f"{label + ':':<18} {future_date_readable} [{future_iso}]")

    # Reference points
    lines.append("")
    lines.append("─── Reference Points ───")

    # 1 week from now
    one_week = now + timedelta(days=7)
    one_week_day = one_week.strftime("%A")
    one_week_readable = one_week.strftime("%B %d, %Y").replace(" 0", " ")
    one_week_iso = one_week.strftime("%Y-%m-%d")
    lines.append(f"{'1 week from now:':<18} {one_week_day}, {one_week_readable} [{one_week_iso}]")

    # 2 weeks from now
    two_weeks = now + timedelta(days=14)
    two_weeks_day = two_weeks.strftime("%A")
    two_weeks_readable = two_weeks.strftime("%B %d, %Y").replace(" 0", " ")
    two_weeks_iso = two_weeks.strftime("%Y-%m-%d")
    lines.append(f"{'2 weeks from now:':<18} {two_weeks_day}, {two_weeks_readable} [{two_weeks_iso}]")

    # End of month
    if now.month == 12:
        end_of_month = now.replace(year=now.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        end_of_month = now.replace(month=now.month + 1, day=1) - timedelta(days=1)
    end_of_month_day = end_of_month.strftime("%A")
    end_of_month_readable = end_of_month.strftime("%B %d, %Y").replace(" 0", " ")
    end_of_month_iso = end_of_month.strftime("%Y-%m-%d")
    lines.append(f"{'End of month:':<18} {end_of_month_day}, {end_of_month_readable} [{end_of_month_iso}]")

    return "\n".join(lines)


def is_new_user() -> bool:
    """
    Check if this is a fresh user (no preferences set).

    Returns:
        True if user_info_and_preferences.md doesn't exist, is empty, or has no name field.
    """
    if not USER_PREFERENCES_FILE.exists():
        return True
    content = USER_PREFERENCES_FILE.read_text().strip()
    if not content:
        return True
    prefs = load_user_info_and_preferences()
    return not prefs.get("name")  # No name = new user


def setup_donna_data_directory() -> bool:
    """
    Copy template folder for new users.

    This ensures the ~/donna-data directory structure exists before onboarding
    starts, so Claude doesn't need to create it via bash commands.

    Returns:
        True if folder was created, False if it already existed.
    """
    template_path = Path(__file__).parent / ".claude/skills/onboarding/template-donna-data"
    if not DONNA_DATA_DIR.exists() and template_path.exists():
        shutil.copytree(template_path, DONNA_DATA_DIR)
        return True
    return False


@dataclass
class PermissionRequest:
    """
    Emitted when the agent needs permission for a tool.
    
    The interface receives this and should call allow() or deny() to respond.
    """
    tool_name: str
    tool_input: dict
    _response_future: asyncio.Future = field(default_factory=lambda: asyncio.get_event_loop().create_future())
    
    async def allow(self) -> None:
        """Allow the tool to execute."""
        if not self._response_future.done():
            self._response_future.set_result(PermissionResultAllow(behavior="allow"))
    
    async def deny(self, message: str = "User denied the request") -> None:
        """Deny the tool execution with an optional message."""
        if not self._response_future.done():
            self._response_future.set_result(PermissionResultDeny(behavior="deny", message=message))
    
    async def wait_for_response(self) -> PermissionResultAllow | PermissionResultDeny:
        """Wait for and return the permission response."""
        return await self._response_future


def load_system_prompt() -> str:
    """Load the system prompt from prompt.md."""
    prompt_path = Path(__file__).parent / "prompt.md"
    return prompt_path.read_text()


def build_full_system_prompt(client_timezone: str | None = None) -> str:
    """
    Build the full system prompt including user preferences, current context, and date/time.

    Args:
        client_timezone: IANA timezone string from client (e.g., "America/New_York").
                        Falls back to user preference, then system timezone.

    Returns:
        Complete system prompt with context injected.
    """
    base_prompt = load_system_prompt()

    # Get effective timezone
    timezone = get_effective_timezone(client_timezone)

    # Generate date context
    date_context = generate_date_context(timezone)

    # Load user preferences
    prefs_content = ""
    if USER_PREFERENCES_FILE.exists():
        prefs_content = USER_PREFERENCES_FILE.read_text()

    # Load current context
    current_context = load_current_context()

    # Build the full prompt with context
    full_prompt = base_prompt

    # Add date/time context first (most important for temporal reasoning)
    full_prompt += f"""

{date_context}
"""

    # Add user info and preferences section
    if prefs_content:
        full_prompt += f"""

## User Info and Preferences (from user_info_and_preferences.md)

IMPORTANT: Use the `name` from frontmatter when addressing the user. Use the `communication_style` to adjust your personality.

{prefs_content}
"""

    # Add current context section
    if current_context.strip():
        full_prompt += f"""

## Current Active Context (from current_context.md)

These are the topics/items the user is currently focused on. Reference these when relevant:

{current_context}
"""
    else:
        full_prompt += """

## Current Active Context

No active context items. This may be a new user or a fresh start.
"""

    return full_prompt


async def create_user_message(text: str) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Create a streaming user message for Claude.

    This uses streaming input mode, which allows for:
    - Adding images to messages later
    - Queueing multiple messages
    - Better control over conversation flow
    - Full access to SDK features (hooks, tools, etc.)

    Args:
        text: The user's message text

    Yields:
        Message dictionary in Claude SDK streaming format
    """
    yield {
        "type": "user",
        "message": {
            "role": "user",
            "content": text
        }
    }


# Type alias for the permission callback
PermissionCallback = Callable[[PermissionRequest], Awaitable[bool]]


class DonnaAgent:
    """
    Core Donna agent that can be used with any interface.
    
    Uses an async callback pattern for permission handling, allowing
    different interfaces (CLI, web, etc.) to handle permissions their own way.
    
    Example usage:
        async def my_permission_handler(request: PermissionRequest) -> bool:
            # Your logic to ask user for permission
            return True  # or False
        
        async with DonnaAgent(on_permission_request=my_permission_handler) as donna:
            # Agent automatically sends a greeting - just receive it
            async for message in donna.receive_response():
                print(message)
            
            # Then continue with normal conversation
            await donna.send_message("Hello!")
            async for message in donna.receive_response():
                print(message)
    """
    
    def __init__(
        self,
        on_permission_request: PermissionCallback | None = None,
        model: str | None = None,
        allowed_tools: list[str] | None = None,
        max_thinking_tokens: int | None = None,
        auto_greet: bool = True,
        client_timezone: str | None = None,
    ):
        """
        Initialize the Donna agent.

        Args:
            on_permission_request: Async callback that receives PermissionRequest.
                                   Return True to allow, False to deny.
                                   If None, all tools are auto-allowed.
            model: The Claude model to use (default from config.MODEL)
            allowed_tools: List of allowed tools (default from config.ALLOWED_TOOLS)
            max_thinking_tokens: Token budget for extended thinking (default from config)
            auto_greet: If True, automatically send a greeting when session starts.
                        The interface should call receive_response() to get it.
            client_timezone: IANA timezone string from client (e.g., "America/New_York").
                            Used for date/time context in system prompt.
        """
        self._on_permission_request = on_permission_request
        self._model = model or MODEL
        self._allowed_tools = allowed_tools or ALLOWED_TOOLS
        self._max_thinking_tokens = max_thinking_tokens if max_thinking_tokens is not None else MAX_THINKING_TOKENS
        self._auto_greet = auto_greet
        self._client_timezone = client_timezone
        self._client: ClaudeSDKClient | None = None
        self._greeting_sent = False
        self._logger = ConversationLogger(LOG_DIR)
    
    async def _permission_handler(
        self,
        tool_name: str,
        tool_input: dict,
        context
    ) -> PermissionResultAllow | PermissionResultDeny:
        """
        Internal permission handler that bridges to the callback.
        
        - Tools in AUTO_ALLOWED_TOOLS: Auto-allowed (for memory/context management)
        - Other tools: Requires callback if provided, otherwise auto-allowed
        """
        # Auto-allow tools configured for automatic permission
        if tool_name in AUTO_ALLOWED_TOOLS:
            return PermissionResultAllow(behavior="allow")
        
        # If no callback provided, auto-allow everything
        if self._on_permission_request is None:
            return PermissionResultAllow(behavior="allow")
        
        # Create permission request and call the callback
        request = PermissionRequest(tool_name=tool_name, tool_input=tool_input)
        
        # Call the callback - it should return True/False
        allowed = await self._on_permission_request(request)
        
        if allowed:
            return PermissionResultAllow(behavior="allow")
        return PermissionResultDeny(behavior="deny", message="User declined the request")
    
    async def __aenter__(self) -> "DonnaAgent":
        """Enter the async context manager, initializing the Claude client."""
        # Build full system prompt with user preferences, current context, and date/time
        full_prompt = build_full_system_prompt(client_timezone=self._client_timezone)
        
        # Get the package directory path for cwd (where .claude/ skills live)
        package_dir = str(Path(__file__).parent)

        options = ClaudeAgentOptions(
            system_prompt=full_prompt,
            model=self._model,
            allowed_tools=self._allowed_tools,
            can_use_tool=self._permission_handler,
            # Set cwd to donna_life_os/ so Donna loads skills from donna_life_os/.claude/
            cwd=package_dir,
            # Load settings from project .claude/ directory
            setting_sources=["project"],
            # Extended thinking configuration
            max_thinking_tokens=self._max_thinking_tokens,
            # Budget limits
            max_budget_usd=MAX_BUDGET_USD,
            max_turns=MAX_TURNS,
            # Capture CLI stderr for debugging
            stderr=lambda line: print(f"[CLI STDERR] {line}"),
            # Hooks: nudge Donna to run context-updater after file operations
            hooks={
                "PostToolUse": [
                    HookMatcher(
                        matcher="Read|Write|Edit",
                        hooks=[nudge_context_updater],
                    )
                ],
            },
        )
        self._client = ClaudeSDKClient(options=options)
        await self._client.__aenter__()
        self._logger.log("system_prompt", {"prompt": full_prompt})
        
        # Send automatic greeting if enabled
        if self._auto_greet:
            greeting_prompt = generate_greeting_prompt()
            self._logger.log("user_message", {"text": greeting_prompt})
            await self._client.query(create_user_message(greeting_prompt))
            self._greeting_sent = True
        
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Exit the async context manager, cleaning up the Claude client."""
        if self._client:
            await self._client.__aexit__(exc_type, exc_val, exc_tb)
            self._client = None
    
    async def send_message(self, text: str) -> None:
        """
        Send a message to the agent.

        Args:
            text: The user's message text

        Raises:
            RuntimeError: If called outside of async context manager
        """
        if self._client is None:
            raise RuntimeError("DonnaAgent must be used as an async context manager")

        self._logger.log("user_message", {"text": text})
        await self._client.query(create_user_message(text))
    
    async def receive_response(self) -> AsyncGenerator[AssistantMessage, None]:
        """
        Receive streaming responses from the agent.

        Yields:
            AssistantMessage objects containing the response

        Raises:
            RuntimeError: If called outside of async context manager
        """
        if self._client is None:
            raise RuntimeError("DonnaAgent must be used as an async context manager")

        async for message in self._client.receive_response():
            self._logger.log_message(message)
            yield message
