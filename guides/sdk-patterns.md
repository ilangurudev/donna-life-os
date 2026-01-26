# Claude Agent SDK Patterns

Donna uses the [Claude Agent SDK](https://docs.anthropic.com/en/docs/agents-and-tools/claude-agent-sdk).

## Configuration

```python
from claude_agent_sdk import ClaudeAgentOptions

options = ClaudeAgentOptions(
    system_prompt=load_system_prompt(),  # From src/prompt.md
    model="sonnet",
    allowed_tools=["Read", "Write", "Bash"],
    permission_mode="default",
)
```

## Streaming Input

Always use streaming for interactive systems:

```python
async def create_user_message(text: str):
    yield {
        "type": "user",
        "message": {"role": "user", "content": text}
    }
```

## Client Usage

```python
async with ClaudeSDKClient(options) as client:
    await client.query(message)
    async for response in client.receive_response():
        # Process streaming response
```
