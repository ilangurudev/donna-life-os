"""
Donna Life OS - Configuration

Centralized configuration for the Donna agent.
"""

from pathlib import Path

# =============================================================================
# Model Configuration
# =============================================================================

# Claude model to use: "sonnet", "opus", "haiku"
MODEL = "haiku"

# Extended thinking budget (tokens). Set to None to disable thinking.
# Higher values = more reasoning depth but more cost.
# Recommended: 8000-16000 for complex tasks
MAX_THINKING_TOKENS = 10000

# =============================================================================
# Tool Configuration
# =============================================================================

# Tools the agent is allowed to use
ALLOWED_TOOLS = ["Read", "Write", "Bash", "Skill", "Grep"]

# Tools that are auto-allowed without user confirmation
AUTO_ALLOWED_TOOLS = ["Read", "Write", "Grep", "Skill"]

# =============================================================================
# Data Paths
# =============================================================================

# Base directory for all Donna data files
# Use absolute path relative to project root (one level up from src/)
PROJECT_ROOT = Path(__file__).parent.parent
DONNA_DATA_DIR = PROJECT_ROOT / "donna-data"

# Key files within the data directory
CURRENT_CONTEXT_FILE = DONNA_DATA_DIR / "current_context.md"
USER_PREFERENCES_FILE = DONNA_DATA_DIR / "user_info_and_preferences.md"

# =============================================================================
# Budget & Limits
# =============================================================================

# Maximum spending limit in USD per session (None = no limit)
MAX_BUDGET_USD: float | None = None

# Maximum conversation turns per session (None = no limit)
MAX_TURNS: int | None = None
