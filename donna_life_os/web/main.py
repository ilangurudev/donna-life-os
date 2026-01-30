"""
Donna Life OS - Web Portal

FastAPI application serving the web interface for Donna.
"""

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware

from .routes import chat, notes, files
from .auth import auth_router, AuthMiddleware, get_auth_config


# Create FastAPI app
app = FastAPI(
    title="Donna Life OS",
    description="AI-native life operating system web portal",
    version="0.1.0",
)

# Get auth configuration
auth_config = get_auth_config()

# Auth middleware (checks authentication on protected routes)
# Added first so it runs AFTER session middleware in the request flow
app.add_middleware(AuthMiddleware)

# Session middleware (required for OAuth)
# Added after auth middleware so it runs BEFORE auth in the request flow
# (Starlette middleware order: last added = first to process request)
app.add_middleware(
    SessionMiddleware,
    secret_key=auth_config.session_secret_key,
    session_cookie=auth_config.session_cookie_name,
    max_age=auth_config.session_max_age,
    same_site="lax",  # Protects against CSRF while allowing OAuth redirects
    https_only=os.getenv("AUTH_HTTPS_ONLY", "false").lower() == "true",
)

# CORS middleware for development
# In production with auth enabled, you may want to restrict origins
cors_origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Add configured base URL to CORS origins if set
if auth_config.base_url:
    cors_origins.append(auth_config.base_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth_router)  # Auth routes first
app.include_router(notes.router)
app.include_router(chat.router)
app.include_router(files.router)


# Health check endpoint (public, no auth required)
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "donna-web",
        "auth_enabled": auth_config.enabled,
    }


# Serve static files in production
# The frontend will be built to web/dist/
STATIC_DIR = Path(__file__).parent.parent.parent / "web" / "dist"

if STATIC_DIR.exists():
    # Serve static assets
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")
    
    # Catch-all route for SPA - serve index.html for any non-API route
    @app.get("/{path:path}")
    async def serve_spa(path: str):
        """Serve the SPA for any non-API route."""
        # Don't intercept API or WebSocket routes
        if path.startswith("api/") or path.startswith("ws/"):
            return {"error": "Not found"}
        
        index_path = STATIC_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        return {"error": "Frontend not built. Run 'npm run build' in web/"}


# Development entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "donna_life_os.web.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["donna_life_os"],
    )
