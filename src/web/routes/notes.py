"""
Notes REST API routes.

Provides endpoints for listing and reading notes from donna-data.
"""

from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException

from ..utils.markdown import build_file_tree, parse_note, resolve_wiki_link

# Import config - handle both package and direct execution
try:
    from ...config import DONNA_DATA_DIR
except ImportError:
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from config import DONNA_DATA_DIR


router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("")
async def list_notes() -> dict[str, Any]:
    """
    Get the complete file tree of notes.
    
    Returns a nested structure representing all markdown files
    in the donna-data directory.
    """
    if not DONNA_DATA_DIR.exists():
        return {
            "type": "directory",
            "name": "donna-data",
            "path": "",
            "children": [],
        }
    
    return build_file_tree(DONNA_DATA_DIR)


@router.get("/{path:path}")
async def get_note(path: str) -> dict[str, Any]:
    """
    Get a single note by path.
    
    Args:
        path: Relative path to the note (e.g., "tasks/order-crib.md")
        
    Returns:
        Parsed note with frontmatter, content, and wiki links
    """
    # Ensure .md extension
    if not path.endswith(".md"):
        path = f"{path}.md"
    
    note_path = DONNA_DATA_DIR / path
    
    # Security: ensure path is within donna-data
    try:
        note_path = note_path.resolve()
        DONNA_DATA_DIR.resolve()
        if not str(note_path).startswith(str(DONNA_DATA_DIR.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
    except Exception:
        raise HTTPException(status_code=403, detail="Invalid path")
    
    if not note_path.exists():
        raise HTTPException(status_code=404, detail=f"Note not found: {path}")
    
    if not note_path.is_file():
        raise HTTPException(status_code=400, detail="Path is not a file")
    
    try:
        content = note_path.read_text()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading note: {e}")
    
    parsed = parse_note(content)
    
    # Resolve wiki links to actual paths
    resolved_links = {}
    for link in parsed.wiki_links:
        resolved = resolve_wiki_link(link, DONNA_DATA_DIR)
        if resolved:
            resolved_links[link] = resolved
    
    return {
        "path": path,
        "frontmatter": parsed.frontmatter,
        "content": parsed.content,
        "raw": parsed.raw,
        "wiki_links": parsed.wiki_links,
        "resolved_links": resolved_links,
    }


@router.get("/resolve/{link:path}")
async def resolve_link(link: str) -> dict[str, str | None]:
    """
    Resolve a wiki link to a file path.
    
    Args:
        link: Wiki link text (e.g., "Baby Prep" or "tasks/order-crib")
        
    Returns:
        The resolved file path, or null if not found
    """
    resolved = resolve_wiki_link(link, DONNA_DATA_DIR)
    return {"link": link, "resolved": resolved}
