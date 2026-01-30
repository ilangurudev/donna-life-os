"""
Donna Life OS - Authentication Module

Google OAuth authentication for protecting the web interface.
"""

from .config import AuthConfig, get_auth_config
from .routes import router as auth_router
from .middleware import AuthMiddleware, get_current_user, require_auth

__all__ = [
    "AuthConfig",
    "get_auth_config",
    "auth_router",
    "AuthMiddleware",
    "get_current_user",
    "require_auth",
]
