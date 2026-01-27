"""
Donna Life OS - Core Agent Module

Reusable agent logic that can be used with any interface (CLI, web, etc.).
Uses async event-based permission handling for flexibility.
"""

import asyncio
import shutil
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import AsyncGenerator, Callable, Awaitable, Dict, Any
from zoneinfo import ZoneInfo
import yaml

from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    AssistantMessage,
    PermissionResultAllow,
    PermissionResultDeny,
)

# Handle both direct execution and package import
try:
    from .config import (
        MODEL,
        MAX_THINKING_TOKENS,
        ALLOWED_TOOLS,
        AUTO_ALLOWED_TOOLS,
        DONNA_DATA_DIR,
        CURRENT_CONTEXT_FILE,
        USER_PREFERENCES_FILE,
        MAX_BUDGET_USD,
        MAX_TURNS,
    )
except ImportError:
    from config import (
        MODEL,
        MAX_THINKING_TOKENS,
        ALLOWED_TOOLS,
        AUTO_ALLOWED_TOOLS,
        DONNA_DATA_DIR,
        CURRENT_CONTEXT_FILE,
        USER_PREFERENCES_FILE,
        MAX_BUDGET_USD,
        MAX_TURNS,
    )


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


def generate_date_context(user_timezone: str | None = None) -> str:
    """
    Generate date/time context for the system prompt.

    Args:
        user_timezone: IANA timezone string (e.g., "America/New_York").
                       If None, uses system local timezone.

    Returns:
        Formatted string with current date/time information for Donna.
    """
    utc_now = datetime.now(timezone.utc)

    # Get user's local time
    if user_timezone:
        try:
            user_tz = ZoneInfo(user_timezone)
        except Exception:
            # Invalid timezone, fall back to UTC
            user_tz = timezone.utc
            user_timezone = "UTC"
    else:
        # No timezone provided, use system local
        user_tz = datetime.now().astimezone().tzinfo
        user_timezone = str(user_tz)

    local_now = utc_now.astimezone(user_tz)

    # Calculate useful date references
    local_day_name = local_now.strftime("%A")
    local_iso_weekday = local_now.isoweekday()  # 1=Monday, 7=Sunday
    utc_day_name = utc_now.strftime("%A")
    utc_iso_weekday = utc_now.isoweekday()

    # Calculate tomorrow for quick reference
    tomorrow = local_now + timedelta(days=1)

    return f"""## Current Date & Time

**Right now for the user:**
- Date: {local_now.strftime("%A, %B %d, %Y")}
- Day of week: {local_day_name} (ISO: {local_iso_weekday}, where Mon=1, Sun=7)
- Time: {local_now.strftime("%I:%M %p")} ({user_timezone})
- Week number: {local_now.isocalendar()[1]}

**For storage (always use UTC):**
- UTC timestamp: {utc_now.strftime("%Y-%m-%dT%H:%M:%SZ")}
- UTC date: {utc_now.strftime("%Y-%m-%d")} ({utc_day_name}, ISO: {utc_iso_weekday})

**Quick reference for calculations (user's local timezone):**
- Today ({local_day_name}): {local_now.strftime("%Y-%m-%d")}
- Tomorrow ({tomorrow.strftime("%A")}): {tomorrow.strftime("%Y-%m-%d")}
- Days until Sunday: {7 - local_iso_weekday if local_iso_weekday < 7 else 0}
- Days until next Monday: {(8 - local_iso_weekday) % 7 or 7}

**Storage rules:**
- Date-only fields (due_date, target_date): Use user's LOCAL date (YYYY-MM-DD)
  - "Wednesday deadline" → due_date: {(local_now + timedelta(days=(3 - local_iso_weekday) % 7 or 7)).strftime("%Y-%m-%d")} (user means THEIR Wednesday)
- Timestamp fields (created, last_updated): Use UTC (YYYY-MM-DDTHH:MM:SSZ)
  - created: {utc_now.strftime("%Y-%m-%dT%H:%M:%SZ")}

**Date interpretation rules:**
- When user says "today" → {local_now.strftime("%Y-%m-%d")}
- When user says "tomorrow" → {tomorrow.strftime("%Y-%m-%d")}
- When user says a day name (e.g., "Wednesday") → find the NEXT occurrence from today ({local_day_name})
- When user says "next [day]" → skip this week, use the following week's occurrence
"""


def get_user_name() -> str:
    """Get the user's name from preferences, or 'there' as fallback."""
    prefs = load_user_info_and_preferences()
    return prefs.get("name", "there")


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


def build_full_system_prompt(user_timezone: str | None = None) -> str:
    """
    Build the full system prompt including user preferences, current context, and date.

    Args:
        user_timezone: IANA timezone string from the user's browser (e.g., "America/New_York").
                       If None, falls back to system local timezone.

    Returns:
        Complete system prompt with context injected.
    """
    base_prompt = load_system_prompt()

    # Load user preferences
    prefs_content = ""
    if USER_PREFERENCES_FILE.exists():
        prefs_content = USER_PREFERENCES_FILE.read_text()

    # Load current context
    current_context = load_current_context()

    # Build the full prompt with context
    full_prompt = base_prompt

    # Add date/time context FIRST (most important for temporal reasoning)
    full_prompt += "\n\n" + generate_date_context(user_timezone)

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
        user_timezone: str | None = None,
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
            user_timezone: IANA timezone string from the user's browser (e.g., "America/New_York").
                           If None, falls back to system local timezone.
        """
        self._on_permission_request = on_permission_request
        self._model = model or MODEL
        self._allowed_tools = allowed_tools or ALLOWED_TOOLS
        self._max_thinking_tokens = max_thinking_tokens if max_thinking_tokens is not None else MAX_THINKING_TOKENS
        self._auto_greet = auto_greet
        self._user_timezone = user_timezone
        self._client: ClaudeSDKClient | None = None
        self._greeting_sent = False
    
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
        full_prompt = build_full_system_prompt(user_timezone=self._user_timezone)
        
        # Get the src directory path for cwd (where .claude/ skills live)
        src_dir = str(Path(__file__).parent)
        
        options = ClaudeAgentOptions(
            system_prompt=full_prompt,
            model=self._model,
            allowed_tools=self._allowed_tools,
            can_use_tool=self._permission_handler,
            # Set cwd to src/ so Donna loads skills from src/.claude/
            cwd=src_dir,
            # Load settings from project .claude/ directory
            setting_sources=["project"],
            # Extended thinking configuration
            max_thinking_tokens=self._max_thinking_tokens,
            # Budget limits
            max_budget_usd=MAX_BUDGET_USD,
            max_turns=MAX_TURNS,
        )
        self._client = ClaudeSDKClient(options=options)
        await self._client.__aenter__()
        
        # Send automatic greeting if enabled
        if self._auto_greet:
            greeting_prompt = generate_greeting_prompt()
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
            yield message
