"""
Donna Life OS - Web Portal

FastAPI application serving the web interface for Donna.
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .routes import chat, notes, files


# Create FastAPI app
app = FastAPI(
    title="Donna Life OS",
    description="AI-native life operating system web portal",
    version="0.1.0",
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(notes.router)
app.include_router(chat.router)
app.include_router(files.router)


# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "donna-web"}


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
        "src.web.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["src"],
    )
