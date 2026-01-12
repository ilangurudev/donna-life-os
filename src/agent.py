"""
Donna Life OS - CLI Entry Point

This file serves as the entry point for running Donna from the command line.
The actual implementation is in cli.py (interface) and core.py (agent logic).

Usage:
    python agent.py
    
Or import the core agent for use in other interfaces:
    from agent import DonnaAgent, PermissionRequest
"""

# Handle both direct execution and package import
if __name__ == "__main__":
    # Direct execution: use absolute import
    from cli import main
    main()
else:
    # Package import: use relative import
    from .cli import main
