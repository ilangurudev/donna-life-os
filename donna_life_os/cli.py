"""
Donna Life OS - CLI Interface

Rich terminal UI for interacting with the Donna agent.
This is one of many possible interfaces for the core agent.
"""

import asyncio
import json

from prompt_toolkit import PromptSession
from prompt_toolkit.formatted_text import HTML
from prompt_toolkit.history import FileHistory
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm
from rich.syntax import Syntax
from rich.text import Text

from claude_agent_sdk import (
    AssistantMessage,
    TextBlock,
    ToolUseBlock,
    ToolResultBlock,
    ResultMessage,
)

from donna_life_os.core import DonnaAgent, PermissionRequest


# Global console for the CLI
console = Console()


# ============================================================================
# Styled Output Functions for Agent Flow Visualization
# ============================================================================

def print_thinking(text: str) -> None:
    """Display agent's reasoning/thinking in a subtle purple panel."""
    panel = Panel(
        Text(text, style="dim"),
        title="[magenta]🧠 Thinking[/magenta]",
        border_style="dim magenta",
        padding=(0, 1),
    )
    console.print(panel)


def print_tool_call(name: str, tool_input: dict) -> None:
    """Display a tool call with its inputs in a yellow panel."""
    # Format the input as pretty JSON
    input_str = json.dumps(tool_input, indent=2, default=str)
    
    # Use syntax highlighting for the JSON
    syntax = Syntax(input_str, "json", theme="monokai", word_wrap=True)
    
    panel = Panel(
        syntax,
        title=f"[yellow]🔧 Tool: {name}[/yellow]",
        border_style="yellow",
        padding=(0, 1),
    )
    console.print(panel)


def print_tool_result(content: str | list | None, is_error: bool = False) -> None:
    """Display tool execution result in green (success) or red (error) panel."""
    # Handle different content types
    if content is None:
        display_content = "[dim]No output[/dim]"
    elif isinstance(content, list):
        # Extract text from content blocks if it's a list
        texts = []
        for item in content:
            if isinstance(item, dict) and "text" in item:
                texts.append(item["text"])
            else:
                texts.append(str(item))
        display_content = "\n".join(texts)
    else:
        display_content = str(content)
    
    # Truncate very long outputs
    max_lines = 20
    lines = display_content.split("\n")
    if len(lines) > max_lines:
        display_content = "\n".join(lines[:max_lines]) + f"\n[dim]... ({len(lines) - max_lines} more lines)[/dim]"
    
    if is_error:
        panel = Panel(
            display_content,
            title="[red]❌ Tool Error[/red]",
            border_style="red",
            padding=(0, 1),
        )
    else:
        panel = Panel(
            display_content,
            title="[green]📤 Tool Result[/green]",
            border_style="green",
            padding=(0, 1),
        )
    console.print(panel)


def print_session_summary(message: ResultMessage) -> None:
    """Display session summary with cost and usage info."""
    summary_parts = []
    
    if message.num_turns:
        summary_parts.append(f"Turns: {message.num_turns}")
    if message.duration_ms:
        summary_parts.append(f"Duration: {message.duration_ms}ms")
    if message.total_cost_usd is not None:
        summary_parts.append(f"Cost: ${message.total_cost_usd:.4f}")
    
    if summary_parts:
        summary_text = " │ ".join(summary_parts)
        console.print(f"\n[dim]─── {summary_text} ───[/dim]")


async def cli_permission_handler(request: PermissionRequest) -> bool:
    """
    CLI-specific permission handler using Rich prompts.
    
    Args:
        request: The permission request from the agent
        
    Returns:
        True if allowed, False if denied
    """
    if request.tool_name == "Bash":
        command = request.tool_input.get("command", "")
        console.print(f"\n[yellow]Donna wants to run:[/yellow] {command}")
        return Confirm.ask("[yellow]Allow this command?[/yellow]")
    
    # Auto-allow other tools (Read/Write are already auto-allowed in core)
    return True


async def run_chat():
    """
    Main chat loop with Rich terminal UI.

    Features:
    - Proactive conversation start (agent greets automatically)
    - Persistent conversation context via DonnaAgent
    - Real-time streaming responses
    - Rich terminal UI with colors and panels
    - Graceful error handling
    - Clean exit on 'exit', 'quit', 'q', or Ctrl+C
    """
    # Display welcome panel
    console.print(Panel.fit(
        "[bold cyan]Donna[/bold cyan] - Your Life Operating System\n"
        "Talk naturally. I'll handle the organization.\n"
        "Type 'exit', 'quit', or 'q' to end",
        border_style="cyan"
    ))

    # Create prompt session with history for readline-style editing
    # Supports: arrow keys, Ctrl+A/E, Ctrl+K, command history, etc.
    session: PromptSession[str] = PromptSession(
        history=FileHistory(".donna_history")
    )

    async def display_response(donna: DonnaAgent) -> ResultMessage | None:
        """Display streaming response from the agent."""
        has_text_response = False
        result_message = None
        
        async for message in donna.receive_response():
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    # Handle thinking/reasoning blocks
                    if hasattr(block, "thinking") and block.thinking:
                        print_thinking(block.thinking)
                    
                    # Handle tool use blocks
                    elif isinstance(block, ToolUseBlock):
                        print_tool_call(block.name, block.input)
                    
                    # Handle tool result blocks
                    elif isinstance(block, ToolResultBlock):
                        print_tool_result(block.content, block.is_error)
                    
                    # Handle text blocks (the actual response)
                    elif isinstance(block, TextBlock):
                        if not has_text_response:
                            console.print("\n[bold blue]Donna:[/bold blue] ", end="")
                            has_text_response = True
                        # soft_wrap=True prevents awkward word-boundary breaks during streaming
                        console.print(block.text, end="", soft_wrap=True)
            
            # Capture result message for summary
            elif isinstance(message, ResultMessage):
                result_message = message
        
        # Add newline after text response
        if has_text_response:
            console.print()
        
        return result_message

    try:
        # Use DonnaAgent as async context manager
        # Agent automatically sends a greeting when session starts
        async with DonnaAgent(on_permission_request=cli_permission_handler) as donna:
            # Display the automatic greeting from the agent
            result_message = await display_response(donna)
            if result_message:
                print_session_summary(result_message)
            
            # Main conversation loop
            while True:
                # Get user input with readline-style editing
                try:
                    console.print()  # Newline before prompt
                    user_input = await session.prompt_async(
                        HTML("<ansigreen><b>You:</b></ansigreen> ")
                    )
                    user_input = user_input.strip()
                except EOFError:
                    # Handle Ctrl+D - update context before exiting
                    await _update_context_and_exit(donna)
                    break

                # Check for exit commands
                if not user_input or user_input.lower() in ["exit", "quit", "q"]:
                    await _update_context_and_exit(donna)
                    break

                # Send message to the agent
                await donna.send_message(user_input)

                # Display response
                result_message = await display_response(donna)
                if result_message:
                    print_session_summary(result_message)

    except KeyboardInterrupt:
        # Handle Ctrl+C gracefully
        console.print("\n[yellow]Chat interrupted by user[/yellow]")
    except Exception as e:
        # Catch any other errors and display nicely
        console.print(f"\n[bold red]Error:[/bold red] {str(e)}")
        console.print(
            "\n[dim]If this persists, check:\n"
            "  - API key is valid\n"
            "  - Network connection is stable\n"
            "  - claude-agent-sdk is installed (pip install claude-agent-sdk)[/dim]"
        )


async def _update_context_and_exit(donna: DonnaAgent) -> None:
    """Update context file and say goodbye."""
    console.print("\n[dim]Updating context...[/dim]")
    await donna.send_message(
        "[SYSTEM] The user is ending this session. "
        "Please update ~/donna-data/current_context.md based on this conversation. "
        "Add any new topics discussed, update last_mentioned dates for existing items, "
        "and remove any items that are no longer relevant. Keep it focused on 5-7 items max. "
        "Do this silently without explaining what you're doing."
    )
    # Consume the response without displaying
    async for _ in donna.receive_response():
        pass
    console.print("[yellow]Goodbye![/yellow]")


def main():
    """
    Entry point for the CLI chat agent.

    Runs the async chat loop and handles any keyboard interrupts.
    """
    try:
        asyncio.run(run_chat())
    except KeyboardInterrupt:
        print("\nGoodbye!")


if __name__ == "__main__":
    main()
