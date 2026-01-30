# Donna Life OS - Agent Guide

**Donna** is an AI-native life OS where the AI maintains the system while humans stay in flow. Natural language in, organized markdown files in `~/donna-data/` out.

### Core Philosophy

- **Capture > Structure** - Accept natural language, AI handles the schema
- **Intelligence > Discipline** - Agents maintain the system; no weekly reviews needed
- **Conversation > Navigation** - Talk to Donna instead of clicking dashboards
- **Listen Before Advising** - Understand energy and context before recommendations
- **Sovereignty > Convenience** - All data lives in local markdown files the user owns

### What Donna Does

- Listens to natural language input and extracts tasks, projects, notes, and context
- Maintains organized markdown files in `~/donna-data/` without user effort
- Tracks current context and surfaces relevant items proactively
- Remembers preferences, relationships, and patterns over time

## Critical: Two `.claude/` Scopes

```
donna-life-os/
├── .claude/                 # FOR YOU (coding agent) - dev tools, code review
├── donna_life_os/
│   ├── .claude/             # FOR DONNA (runtime) - skills, user commands
│   ├── core.py              # DonnaAgent class
│   ├── cli.py               # Terminal interface
│   └── prompt.md            # Donna's personality/system prompt
├── ~/donna-data/            # User's data (tasks, projects, notes)
└── guides/                  # Detailed documentation
```

**Why two scopes?** The SDK loads `.claude/` from `cwd`. Donna runs from `donna_life_os/`, coding agents run from root. No conflicts.

## Key Files

| File | Purpose | Modify when... |
|------|---------|----------------|
| `donna_life_os/prompt.md` | Donna's personality & behavior | Changing capabilities or personality |
| `donna_life_os/core.py` | Agent implementation | Adding tools, changing permissions |
| `donna_life_os/cli.py` | Terminal UI | Improving UX |

## Quick Reference

- **Run web**: `./start-backend` + `./start-frontend` → http://localhost:5173
- **Run CLI**: `uv run python -m donna_life_os.cli`
- **Install**: `uv sync` (Python) / `cd web && npm install` (frontend)

## Further Reading

- `guides/development.md` - Adding skills, subagents, interfaces, context
- `guides/sdk-patterns.md` - Claude Agent SDK code patterns
