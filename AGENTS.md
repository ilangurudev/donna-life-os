# Donna Life OS - Agent Development Guide

This document provides instructions for coding agents (Claude, Cursor, Copilot, etc.) working on the Donna Life OS project.

## Project Overview

**Donna** is an AI-native life operating system that flips the traditional productivity model: instead of humans maintaining complex systems, the AI maintains the system while humans stay in flow.

### Core Philosophy

- **Capture > Structure** - Accept natural language, AI handles the schema
- **Intelligence > Discipline** - Agents maintain the system; no weekly reviews needed
- **Conversation > Navigation** - Talk to Donna instead of clicking dashboards
- **Listen Before Advising** - Understand energy and context before recommendations
- **Sovereignty > Convenience** - All data lives in local markdown files the user owns

### What Donna Does

- Listens to natural language input and extracts tasks, projects, notes, and context
- Maintains organized markdown files in `donna-data/` without user effort
- Tracks current context and surfaces relevant items proactively
- Remembers preferences, relationships, and patterns over time

---

## Critical Architecture: Two `.claude/` Scopes

**This is the most important concept for coding agents to understand.**

This project has TWO separate `.claude/` configuration scopes with entirely different purposes:

```
donna-life-os/
├── .claude/                      # SCOPE 1: FOR CODING AGENTS
│   ├── settings.json             # Tool permissions for YOU (the coding agent)
│   ├── commands/                 # Slash commands for development workflows
│   └── agents/                   # Subagents for code review, testing, etc.
│
├── src/
│   ├── .claude/                  # SCOPE 2: FOR DONNA (runtime configuration)
│   │   ├── settings.json         # Donna's tool permissions at runtime
│   │   ├── commands/             # Slash commands available to Donna users
│   │   ├── skills/               # Donna's skills (onboarding, planning, etc.)
│   │   └── agents/               # Donna's subagents (planner, researcher, etc.)
│   │
│   ├── core.py                   # DonnaAgent class implementation
│   ├── cli.py                    # Rich CLI interface
│   └── prompt.md                # Donna's personality and system prompt
│
├── donna-data/                   # User's data (tasks, projects, notes, etc.)
├── guides/                       # Project documentation and plans
└── AGENTS.md                     # This file
```

### Scope 1: Root `.claude/` - For Coding Agents (You)

This folder configures **your behavior as a coding agent** helping develop this codebase.

Use this for:
- Development workflow commands (e.g., `/run-tests`, `/lint`, `/deploy`)
- Code review subagents
- Refactoring assistants
- Any tooling that helps BUILD Donna

**Example**: A `/review-pr` command that analyzes code changes before committing.

### Scope 2: `src/.claude/` - For Donna Agent (Runtime)

This folder configures **Donna's behavior when running as the personal agent**.

Use this for:
- User-facing skills (e.g., onboarding new users, weekly planning)
- Donna's subagents (e.g., task prioritizer, context summarizer)
- Slash commands Donna users can invoke (e.g., `/checkin`, `/review-week`)
- Any functionality that IS Donna

**Example**: An `onboarding` skill that guides new users through setting up their preferences.

### Why This Separation Matters

When the Claude Agent SDK loads configuration, it uses the working directory's `.claude/` folder. By keeping Donna's configuration in `src/.claude/`:

1. **Donna runs from `src/`** - Her `cwd` is set to `src/`, so she loads `src/.claude/`
2. **Coding agents run from root** - Your `cwd` is the project root, so you load `.claude/`
3. **No conflicts** - Development tools don't interfere with Donna's runtime behavior
4. **Clear ownership** - It's obvious which configuration is for what

---

## Technology Stack

### Claude Agent SDK (Python)

Donna is built using the [Claude Agent SDK](https://context7.com/websites/platform_claude_en_agent-sdk/llms.txt?tokens=10000):

```bash
# Installation
uv add claude-agent-sdk

# Or with pip
pip install claude-agent-sdk
```

### Key SDK Concepts

**ClaudeAgentOptions** - Configure the agent:
```python
from claude_agent_sdk import ClaudeAgentOptions

options = ClaudeAgentOptions(
    system_prompt=load_system_prompt(),  # From src/prompt.md
    model="sonnet",                       # claude-sonnet-4-5
    allowed_tools=["Read", "Write", "Bash"],
    permission_mode="default",            # Ask before sensitive operations
)
```

**Streaming Input Mode** - Always use this for interactive systems:
```python
async def create_user_message(text: str):
    yield {
        "type": "user",
        "message": {"role": "user", "content": text}
    }
```

**ClaudeSDKClient** - Maintains conversation context:
```python
async with ClaudeSDKClient(options) as client:
    await client.query(message)
    async for response in client.receive_response():
        # Process streaming response
```

### Other Dependencies

- **Rich** - Terminal UI with colors, panels, syntax highlighting
- **prompt_toolkit** - Readline-style input with history
- **PyYAML** - Parsing frontmatter in markdown files
- **uv** - Fast Python package manager

---

## Key Files Reference

### `src/prompt.md` - Donna's Personality

This is Donna's system prompt. It defines:
- Core purpose and philosophy
- Personality traits (mirror user's tone, no-BS, push back thoughtfully)
- Critical behavior: always ask clarifying questions
- Data model and file formats
- Tool usage guidelines
- Context management rules

**When to modify**: Changing Donna's behavior, adding new capabilities, adjusting personality.

### `src/core.py` - DonnaAgent Class

The core agent implementation:
- `DonnaAgent` - Main class with async context manager pattern
- `build_full_system_prompt()` - Injects user preferences and current context
- `PermissionRequest` - Event-based permission handling
- Context loading/saving utilities

**When to modify**: Adding new tools, changing permission logic, modifying context handling.

### `src/cli.py` - Terminal Interface

Rich terminal UI implementation:
- Welcome screen and proactive conversation choices
- Streaming response display with tool call visualization
- Permission prompts for sensitive operations
- Session summary with cost tracking

**When to modify**: Improving UX, adding new display elements, changing input handling.

---

## Development Guidelines

### 1. Maintain the Two-Scope Separation

**DO**: Create Donna skills/agents in `src/.claude/`
**DO**: Create development tools in root `.claude/`
**DON'T**: Mix runtime Donna configuration with development tooling

### 2. Use Streaming Input Mode

Always use async generators for messages, even for simple text:

```python
# Good
async def create_message(text):
    yield {"type": "user", "message": {"role": "user", "content": text}}

# Avoid for interactive systems
query(prompt="simple string")
```

### 5. Permission Handling

- `Read` and `Write` are auto-allowed (for memory/context management)
- `Bash` requires user confirmation via callback
- Add new tools to `allowed_tools` in `ClaudeAgentOptions`



## Donna Configuration (`src/.claude/`)

### Adding a Skill

Skills are reusable capabilities Donna can invoke. Create in `src/.claude/skills/`:

```
src/.claude/skills/
└── onboarding/
    └── SKILL.md
```

**Example `SKILL.md`**:
```markdown
---
description: Guide new users through initial setup
---

# User Onboarding Skill

When onboarding a new user:
...
```

### Adding a Subagent

Subagents are specialized agents Donna can delegate to. Define in code or `src/.claude/agents/`:

```python
# In code (src/core.py or separate module)
from claude_agent_sdk import AgentDefinition

agents = {
    "task-prioritizer": AgentDefinition(
        description="Analyzes tasks and suggests priority order",
        prompt="You prioritize tasks based on urgency, importance, and energy required...",
        tools=["Read", "Grep", "Glob"],
        model="haiku"  # Faster for analysis tasks
    ),
    "weekly-planner": AgentDefinition(
        description="Creates weekly plans from tasks and projects",
        prompt="You help plan the week ahead...",
        tools=["Read", "Write"],
        model="sonnet"
    )
}
```

### Adding a Slash Command

Slash commands are shortcuts Donna users can invoke. Create in `src/.claude/commands/`:

```
src/.claude/commands/
└── weekly-review.md
```

**Example command**:
```markdown
---
description: Review the past week and plan ahead
---

Review my week:
...
```

---

## Example Development Workflows

### Adding a New Tool to Donna

1. Add tool to `allowed_tools` in `src/core.py`:
   ```python
   self._allowed_tools = allowed_tools or ["Read", "Write", "Bash", "Grep"]
   ```

2. Update permission handler if needed:
   ```python
   async def _permission_handler(self, tool_name, tool_input, context):
       if tool_name == "Grep":
           return PermissionResultAllow(behavior="allow")
       # ... existing logic
   ```

3. Update `src/prompt.md` to explain the new tool to Donna

### Creating a New Interface

The `DonnaAgent` class is interface-agnostic. To create a new interface:

1. Import and use `DonnaAgent` as async context manager
2. Implement your own permission callback
3. Handle streaming responses your way

```python
from core import DonnaAgent, PermissionRequest

async def web_permission_handler(request: PermissionRequest) -> bool:
    # Your web-specific permission UI
    return await show_permission_modal(request)

async def handle_web_request(user_message: str):
    async with DonnaAgent(on_permission_request=web_permission_handler) as donna:
        await donna.send_message(user_message)
        async for message in donna.receive_response():
            yield format_for_web(message)
```

### Modifying Donna's Personality

1. Edit `src/prompt.md`
2. Test changes by running the CLI: `uv run python -m src.cli`
3. Iterate based on conversation behavior

### Adding Context Awareness

To make Donna aware of new data types:

1. Add directory to `donna-data/` if needed
2. Update the data model section in `src/prompt.md`
3. Add loading logic to `src/core.py` if it should be in system prompt
4. Update `build_full_system_prompt()` to inject the new context

---

## Running and Testing

### Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) package manager
- Node.js 18+ (for web frontend)
- `ANTHROPIC_API_KEY` environment variable

### Installation

```bash
# Install Python dependencies
uv sync

# Install frontend dependencies
cd web && npm install && cd ..
```

### Running the Web Interface (Dev Servers)

Start **both** servers in separate terminals:

**Terminal 1 - Backend (FastAPI on port 8000)**:
```bash
uv run uvicorn src.web.main:app --reload --port 8000
```

**Terminal 2 - Frontend (Vite on port 5173)**:
```bash
cd web && npm run dev
```

Then open http://localhost:5173

### Running the CLI

For the terminal interface (no web server needed):

```bash
uv run python -m src.cli
```

---

## Common Pitfalls

1. **Wrong `.claude/` scope** - Always check which scope you're modifying
2. **Forgetting streaming mode** - Use async generators for all interactive messages
3. **Hardcoding paths** - Use `Path(__file__).parent` for relative paths
4. **Missing permissions** - Add new tools to `allowed_tools` AND handle in permission callback
5. **Blocking the event loop** - Use `async/await` throughout; avoid synchronous I/O
