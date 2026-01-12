"""
Authentication middleware.

Protects API routes and WebSocket endpoints from unauthenticated access.
"""

from typing import Callable, Any

from fastapi import Request, WebSocket, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse

from .config import get_auth_config


# Routes that don't require authentication
PUBLIC_ROUTES = {
    "/api/auth/login/google",
    "/api/auth/callback/google",
    "/api/auth/status",
    "/api/auth/logout",
    "/api/health",
}

# Route prefixes that don't require authentication
PUBLIC_PREFIXES = (
    "/assets/",
    "/donna-icon.svg",
)


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware that enforces authentication on protected routes.
    
    - API routes (/api/*) require authentication (except auth routes)
    - WebSocket routes (/ws/*) require authentication
    - Static files and SPA routes are allowed through
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        config = get_auth_config()
        
        # If auth is disabled, allow everything
        if not config.enabled:
            return await call_next(request)
        
        path = request.url.path
        
        # Check if route is public
        if self._is_public_route(path):
            return await call_next(request)
        
        # Check if route requires auth
        if self._requires_auth(path):
            user = request.session.get("user")
            
            if not user:
                # Return 401 for API routes
                if path.startswith("/api/"):
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={"detail": "Not authenticated"},
                    )
                
                # For other routes, could redirect to login
                # But we'll let the SPA handle it
                pass
        
        return await call_next(request)
    
    def _is_public_route(self, path: str) -> bool:
        """Check if a route is explicitly public."""
        if path in PUBLIC_ROUTES:
            return True
        
        for prefix in PUBLIC_PREFIXES:
            if path.startswith(prefix):
                return True
        
        return False
    
    def _requires_auth(self, path: str) -> bool:
        """Check if a route requires authentication."""
        # API routes require auth
        if path.startswith("/api/"):
            return True
        
        # WebSocket routes are handled separately
        # (middleware doesn't intercept WebSocket upgrades the same way)
        
        return False


async def get_current_user(request: Request) -> dict[str, Any] | None:
    """
    Get the current authenticated user from the request.
    
    Returns None if not authenticated or auth is disabled.
    """
    config = get_auth_config()
    
    if not config.enabled:
        # Return a mock user when auth is disabled
        return {
            "email": "local@localhost",
            "name": "Local User",
            "picture": "",
        }
    
    return request.session.get("user")


async def require_auth(request: Request) -> dict[str, Any]:
    """
    Dependency that requires authentication.
    
    Raises HTTPException 401 if user is not authenticated.
    """
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    return user


async def verify_websocket_auth(websocket: WebSocket) -> dict[str, Any] | None:
    """
    Verify authentication for WebSocket connections.
    
    WebSocket connections share the same session cookies as HTTP requests.
    
    Returns user dict if authenticated, None otherwise.
    """
    config = get_auth_config()
    
    if not config.enabled:
        return {
            "email": "local@localhost",
            "name": "Local User",
            "picture": "",
        }
    
    # Access the session from the WebSocket's scope
    # The session middleware should have populated this
    session = websocket.scope.get("session", {})
    return session.get("user")


async def require_websocket_auth(websocket: WebSocket) -> dict[str, Any]:
    """
    Require authentication for WebSocket connections.
    
    Closes the WebSocket with 4001 if not authenticated.
    """
    user = await verify_websocket_auth(websocket)
    
    if not user:
        await websocket.close(code=4001, reason="Not authenticated")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="WebSocket authentication required",
        )
    
    return user
