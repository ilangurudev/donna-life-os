"""
Authentication routes.

Handles Google OAuth login flow and session management.
"""

from typing import Any

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import RedirectResponse
from starlette.config import Config

from .config import get_auth_config


router = APIRouter(prefix="/api/auth", tags=["auth"])

# OAuth client - initialized lazily
_oauth: OAuth | None = None


def get_oauth(request: Request) -> OAuth:
    """Get or create OAuth client."""
    global _oauth
    
    if _oauth is not None:
        return _oauth
    
    config = get_auth_config()
    
    # Determine base URL for callback
    if config.base_url:
        base_url = config.base_url.rstrip("/")
    else:
        # Infer from request
        scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
        host = request.headers.get("x-forwarded-host", request.url.netloc)
        base_url = f"{scheme}://{host}"
    
    _oauth = OAuth()
    _oauth.register(
        name="google",
        client_id=config.google_client_id,
        client_secret=config.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
    
    return _oauth


@router.get("/login/google")
async def login_google(request: Request):
    """
    Initiate Google OAuth login.
    
    Redirects the user to Google's OAuth consent screen.
    """
    config = get_auth_config()
    
    if not config.enabled:
        raise HTTPException(status_code=404, detail="Authentication not enabled")
    
    oauth = get_oauth(request)
    
    # Build callback URL
    if config.base_url:
        redirect_uri = f"{config.base_url.rstrip('/')}/api/auth/callback/google"
    else:
        redirect_uri = request.url_for("callback_google")
    
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback/google")
async def callback_google(request: Request):
    """
    Handle Google OAuth callback.
    
    Exchanges the authorization code for tokens, validates the user,
    creates a session, and redirects to the app.
    """
    config = get_auth_config()
    
    if not config.enabled:
        raise HTTPException(status_code=404, detail="Authentication not enabled")
    
    oauth = get_oauth(request)
    
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        # OAuth error - redirect to login with error
        return RedirectResponse(url="/?auth_error=oauth_failed")
    
    # Get user info from the ID token
    user_info = token.get("userinfo")
    if not user_info:
        return RedirectResponse(url="/?auth_error=no_user_info")
    
    email = user_info.get("email")
    if not email:
        return RedirectResponse(url="/?auth_error=no_email")
    
    # Check if email is allowed
    if not config.is_email_allowed(email):
        return RedirectResponse(url="/?auth_error=email_not_allowed")
    
    # Store user info in session
    request.session["user"] = {
        "email": email,
        "name": user_info.get("name", ""),
        "picture": user_info.get("picture", ""),
        "sub": user_info.get("sub", ""),  # Google user ID
    }
    
    # Redirect to app
    return RedirectResponse(url="/")


@router.get("/logout")
async def logout(request: Request):
    """
    Log out the current user.
    
    Clears the session and redirects to the login page.
    """
    request.session.clear()
    return RedirectResponse(url="/")


@router.get("/me")
async def get_current_user_info(request: Request) -> dict[str, Any]:
    """
    Get current user information.
    
    Returns user info if authenticated, or 401 if not.
    """
    config = get_auth_config()
    
    # If auth is disabled, return a mock user
    if not config.enabled:
        return {
            "authenticated": True,
            "auth_enabled": False,
            "user": {
                "email": "local@localhost",
                "name": "Local User",
                "picture": "",
            }
        }
    
    user = request.session.get("user")
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {
        "authenticated": True,
        "auth_enabled": True,
        "user": user,
    }


@router.get("/status")
async def auth_status(request: Request) -> dict[str, Any]:
    """
    Get authentication status.
    
    Returns whether auth is enabled and if the user is authenticated.
    Does not require authentication.
    """
    config = get_auth_config()
    
    if not config.enabled:
        return {
            "auth_enabled": False,
            "authenticated": True,  # Always "authenticated" when auth disabled
        }
    
    user = request.session.get("user")
    
    return {
        "auth_enabled": True,
        "authenticated": user is not None,
        "user": user if user else None,
    }
