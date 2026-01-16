# Donna Life OS

An AI-native life operating system that flips the traditional productivity model: instead of humans maintaining complex systems, the AI maintains the system while humans stay in flow.

## Quick Start

### Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Node.js 18+ (for web frontend)
- `ANTHROPIC_API_KEY` environment variable set

### Installation

```bash
# Install Python dependencies
uv sync

# Install frontend dependencies
cd web && npm install && cd ..
```

### Running Dev Servers

You need to run **both** the backend and frontend servers for the web interface:

**Terminal 1 - Backend (FastAPI)**:
```bash
uv run uvicorn src.web.main:app --reload --port 8000
```

**Terminal 2 - Frontend (Vite)**:
```bash
cd web && npm run dev
```

Then open http://localhost:5173 in your browser.

### Running the CLI

For the terminal interface (no web server needed):

```bash
uv run python -m src.cli
```

## Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# Required
ANTHROPIC_API_KEY=your-api-key-here

# Optional - Authentication (disabled by default)
AUTH_ENABLED=false
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET_KEY=your-secure-random-key

# Optional - Restrict access to specific email domains
ALLOWED_EMAIL_DOMAINS=example.com,mycompany.com
```

## Project Structure

```
donna-life-os/
├── src/                    # Python backend
│   ├── cli.py              # Terminal interface
│   ├── core.py             # DonnaAgent class
│   ├── web/                # FastAPI web server
│   └── .claude/            # Donna runtime configuration
├── web/                    # React frontend (Vite + TypeScript)
├── donna-data/             # User's data (markdown files)
└── AGENTS.md               # Guide for coding agents
```

## Documentation

- **AGENTS.md** - Development guide for coding agents (Claude, Cursor, etc.)
- **guides/** - Additional project documentation
