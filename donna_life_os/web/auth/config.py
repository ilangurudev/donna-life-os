"""
Authentication configuration.

Reads from environment variables to configure Google OAuth.
"""

import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass
class AuthConfig:
    """Authentication configuration."""
    
    # Whether authentication is enabled
    enabled: bool
    
    # Google OAuth credentials
    google_client_id: str
    google_client_secret: str
    
    # Session configuration
    session_secret_key: str
    session_cookie_name: str = "donna_session"
    session_max_age: int = 60 * 60 * 24 * 7  # 7 days
    
    # Allowed email domains (empty list = allow all)
    allowed_email_domains: list[str] | None = None

    # Exact email match (takes priority over domains)
    allowed_email: str | None = None
    
    # Base URL for OAuth callbacks (e.g., "https://myapp.com")
    # If not set, will be inferred from request
    base_url: str | None = None
    
    def is_email_allowed(self, email: str) -> bool:
        """Check if an email address is allowed to access the app."""
        # Exact email match takes priority
        if self.allowed_email:
            return email.lower() == self.allowed_email.lower()

        # Fall back to domain check
        if not self.allowed_email_domains:
            return True

        domain = email.split("@")[-1].lower()
        return domain in [d.lower() for d in self.allowed_email_domains]


@lru_cache()
def get_auth_config() -> AuthConfig:
    """
    Get authentication configuration from environment variables.
    
    Required environment variables when AUTH_ENABLED=true:
    - GOOGLE_CLIENT_ID: Google OAuth client ID
    - GOOGLE_CLIENT_SECRET: Google OAuth client secret
    - SESSION_SECRET_KEY: Secret key for session encryption
    
    Optional environment variables:
    - AUTH_ENABLED: Set to "true" to enable authentication (default: false)
    - ALLOWED_EMAIL: Exact email address to allow (takes priority over domains)
    - ALLOWED_EMAIL_DOMAINS: Comma-separated list of allowed email domains
    - AUTH_BASE_URL: Base URL for OAuth callbacks
    - SESSION_MAX_AGE: Session duration in seconds (default: 604800 = 7 days)
    """
    enabled = os.getenv("AUTH_ENABLED", "false").lower() == "true"
    
    # Parse allowed domains
    domains_str = os.getenv("ALLOWED_EMAIL_DOMAINS", "")
    allowed_domains = [d.strip() for d in domains_str.split(",") if d.strip()] or None
    
    # Session max age
    session_max_age = int(os.getenv("SESSION_MAX_AGE", str(60 * 60 * 24 * 7)))
    
    # Parse allowed email
    allowed_email = os.getenv("ALLOWED_EMAIL", "").strip() or None

    return AuthConfig(
        enabled=enabled,
        google_client_id=os.getenv("GOOGLE_CLIENT_ID", ""),
        google_client_secret=os.getenv("GOOGLE_CLIENT_SECRET", ""),
        session_secret_key=os.getenv("SESSION_SECRET_KEY", "dev-secret-key-change-in-production"),
        allowed_email_domains=allowed_domains,
        allowed_email=allowed_email,
        base_url=os.getenv("AUTH_BASE_URL"),
        session_max_age=session_max_age,
    )


def validate_auth_config(config: AuthConfig) -> list[str]:
    """
    Validate auth configuration and return list of errors.
    
    Returns empty list if config is valid.
    """
    errors = []
    
    if not config.enabled:
        return errors
    
    if not config.google_client_id:
        errors.append("GOOGLE_CLIENT_ID is required when authentication is enabled")
    
    if not config.google_client_secret:
        errors.append("GOOGLE_CLIENT_SECRET is required when authentication is enabled")
    
    if config.session_secret_key == "dev-secret-key-change-in-production":
        errors.append("SESSION_SECRET_KEY must be set to a secure random value in production")
    
    return errors
