# Donna Web Portal

A beautiful web interface for the Donna Life OS agent.

## Features

- **Side-by-side layout**: Notes panel on the left, Chat panel on the right
- **Real-time chat**: WebSocket-based streaming responses from the AI agent
- **Dev/Prod mode toggle**: 
  - Dev mode: Shows thinking process, tool calls, and detailed stats
  - Clean mode: Just the conversation, no technical details
- **Notes browser**: 
  - File tree navigation
  - Obsidian-style frontmatter display
  - Wiki link support (`[[link]]` format) with click-to-navigate
  - Markdown rendering with syntax highlighting
- **Live updates**: Notes automatically refresh when modified by the agent
- **Permission handling**: Modal prompts for tool execution approval

## Development

### Prerequisites

- Node.js 18+
- Python 3.12+
- The backend requires `ANTHROPIC_API_KEY` environment variable

### Running Locally

1. **Start the backend** (from project root):
   ```bash
   uv run uvicorn src.web.main:app --reload --port 8000
   ```

2. **Start the frontend** (in another terminal):
   ```bash
   cd web
   npm run dev
   ```

3. Open http://localhost:5173

The Vite dev server proxies `/api/*` and `/ws/*` requests to the backend.

### Building for Production

```bash
cd web
npm run build
```

The built files go to `web/dist/`. The FastAPI backend will automatically serve them.

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- TanStack Query for data fetching
- React Markdown for rendering

### Backend
- FastAPI
- WebSockets for real-time communication
- Watchdog for file system monitoring

## Project Structure

```
web/
├── src/
│   ├── components/
│   │   ├── ChatPanel/     # Chat interface components
│   │   ├── NotesPanel/    # Notes browser components
│   │   └── Layout/        # Layout utilities
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand state stores
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── package.json
├── tailwind.config.js
└── vite.config.ts
```
