# Development Guide

## Adding a Skill

Skills are reusable capabilities Donna can invoke. Create in `src/.claude/skills/`:

```
src/.claude/skills/
└── onboarding/
    └── SKILL.md
```

The `name` field in SKILL.md frontmatter must match the folder name.

## Adding a Subagent

Define in `src/.claude/agents/` for specialized delegation (task prioritizer, context summarizer, etc.)

## Creating a New Interface

`DonnaAgent` is interface-agnostic:

```python
from core import DonnaAgent, PermissionRequest

async def permission_handler(request: PermissionRequest) -> bool:
    return await show_permission_modal(request)

async def handle_request(user_message: str):
    async with DonnaAgent(on_permission_request=permission_handler) as donna:
        await donna.send_message(user_message)
        async for message in donna.receive_response():
            yield format_response(message)
```

## Adding Context Awareness

1. Add directory to `~/donna-data/` if needed
2. Update data model in `src/prompt.md`
3. Add loading logic to `src/core.py`
4. Update `build_full_system_prompt()` to inject the context

## Permission Handling

- `Read` and `Write` are auto-allowed (memory/context management)
- `Bash` requires user confirmation via callback
- Add new tools to `allowed_tools` in `ClaudeAgentOptions`
