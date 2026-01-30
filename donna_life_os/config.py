"""
Donna Life OS - Configuration

Centralized configuration for the Donna agent.
"""

from pathlib import Path

# =============================================================================
# Model Configuration
# =============================================================================

# Claude model to use: "sonnet", "opus", "haiku"
MODEL = "opus"

# Extended thinking budget (tokens). Set to None to disable thinking.
# Higher values = more reasoning depth but more cost.
# Recommended: 8000-16000 for complex tasks
MAX_THINKING_TOKENS = 10000

# =============================================================================
# Tool Configuration
# =============================================================================

# Tools the agent is allowed to use
# Core tools:
#   - Read: Read file contents
#   - Write: Create/overwrite files
#   - Edit: Make targeted edits to files (better than Write for updates)
#   - Bash: Execute shell commands (requires user confirmation)
#   - Skill: Invoke .claude/skills
# Search/navigation tools:
#   - Grep: Search file contents by pattern
#   - Glob: Find files by name/pattern (e.g., "*.md", "tasks/*.md")
#   - LS: List directory contents
# Agent orchestration tools:
#   - Task: Delegate to subagents defined in .claude/agents or code
ALLOWED_TOOLS = [
    "Read",
    "Write",
    "Edit",
    # "Bash" - requires user permission via callback (not pre-authorized)
    "Skill",
    "Grep",
    "Glob",
    "Task",
]

# Tools that are auto-allowed without user confirmation
# These are safe, read-only or ~/donna-data-focused operations
AUTO_ALLOWED_TOOLS = [
    "Read",
    "Write",
    "Edit",
    "Grep",
    "Glob",
    "Skill",
    "Task",
]

# =============================================================================
# Data Paths
# =============================================================================

# Project root for reference (one level up from donna_life_os/)
PROJECT_ROOT = Path(__file__).parent.parent

# Base directory for all Donna data files
# Uses ~/donna-data for user's home directory (persistent across projects)
DONNA_DATA_DIR = Path.home() / "donna-data"

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

# =============================================================================
# Logging
# =============================================================================

# Directory for conversation logs
LOG_DIR = PROJECT_ROOT / "logs"
