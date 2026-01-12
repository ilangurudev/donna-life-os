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
- **Google OAuth authentication**: Secure access when deployed to a web service

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

## Authentication Setup

When deploying to a web service, enable Google OAuth to protect your notes and chat.

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Configure OAuth consent screen:
   - User type: External (or Internal for Google Workspace)
   - Add your email to test users during development
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
5. Copy the Client ID and Client Secret

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Enable authentication
AUTH_ENABLED=true

# Google OAuth credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Generate a secure random string (e.g., openssl rand -hex 32)
SESSION_SECRET_KEY=your-secure-random-string

# Your production URL
AUTH_BASE_URL=https://your-domain.com

# Enable secure cookies for HTTPS
AUTH_HTTPS_ONLY=true

# Optional: Restrict to specific email domains
ALLOWED_EMAIL_DOMAINS=yourdomain.com,company.org
```

### 3. What's Protected

When `AUTH_ENABLED=true`:

- **All API endpoints** (`/api/*`) require authentication (except `/api/auth/*` and `/api/health`)
- **WebSocket connections** (`/ws/*`) require authentication
- **Frontend** shows a login page for unauthenticated users
- **Sessions** are stored in secure HTTP-only cookies (7 days by default)

### Security Features

- **HTTP-only cookies**: Session tokens can't be accessed by JavaScript (XSS protection)
- **SameSite=Lax cookies**: Protection against CSRF while allowing OAuth redirects
- **Email domain restriction**: Optionally limit access to specific email domains
- **Secure cookies**: When `AUTH_HTTPS_ONLY=true`, cookies only sent over HTTPS

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
