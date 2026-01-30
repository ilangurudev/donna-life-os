# Development Guide

## Adding a Skill

Skills are reusable capabilities Donna can invoke. Create in `donna_life_os/.claude/skills/`:

```
donna_life_os/.claude/skills/
└── onboarding/
    └── SKILL.md
```

The `name` field in SKILL.md frontmatter must match the folder name.

## Adding a Subagent

Define in `donna_life_os/.claude/agents/` for specialized delegation (task prioritizer, context summarizer, etc.)

## Creating a New Interface

`DonnaAgent` is interface-agnostic:

```python
from donna_life_os.core import DonnaAgent, PermissionRequest

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
2. Update data model in `donna_life_os/prompt.md`
3. Add loading logic to `donna_life_os/core.py`
4. Update `build_full_system_prompt()` to inject the context

## Permission Handling

Auto-allowed tools (no user confirmation needed):
- `Read`, `Write`, `Edit` - File operations for memory/context management
- `Grep`, `Glob` - Search and file discovery
- `Skill`, `Task` - Agent orchestration

Tools requiring user confirmation:
- `Bash` - Shell commands are prompted via the permission callback

To add new tools, update `ALLOWED_TOOLS` and `AUTO_ALLOWED_TOOLS` in `donna_life_os/config.py`.
