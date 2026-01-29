"""
Notes REST API routes.

Provides endpoints for listing and reading notes from ~/donna-data.
"""

import os
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..utils.markdown import build_file_tree, parse_note, resolve_wiki_link, parse_frontmatter


class NoteContent(BaseModel):
    """Request body for updating note content."""
    content: str

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
    in the ~/donna-data directory.
    """
    if not DONNA_DATA_DIR.exists():
        return {
            "type": "directory",
            "name": "donna-data",
            "path": "",
            "children": [],
        }
    
    return build_file_tree(DONNA_DATA_DIR)


@router.get("/recent")
async def list_recent_notes(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> dict[str, Any]:
    """
    Get a flat list of notes sorted by modification time (most recent first).
    
    This is optimized for mobile interfaces and scenarios with many notes.
    
    Args:
        limit: Maximum number of notes to return (default 50, max 500)
        offset: Number of notes to skip for pagination
        
    Returns:
        List of notes with metadata, sorted by modification time
    """
    if not DONNA_DATA_DIR.exists():
        return {
            "notes": [],
            "total": 0,
            "has_more": False,
        }
    
    # Collect all markdown files with their modification times
    all_notes = []
    for md_file in DONNA_DATA_DIR.rglob("*.md"):
        # Skip hidden files
        if any(part.startswith(".") for part in md_file.parts):
            continue

        # Skip template files
        if md_file.name.endswith("_template.md"):
            continue

        try:
            stat = md_file.stat()
            rel_path = str(md_file.relative_to(DONNA_DATA_DIR))
            
            # Get parent folder name for context
            parent = md_file.parent
            folder = parent.name if parent != DONNA_DATA_DIR else None
            
            # Parse frontmatter for title and metadata
            content = md_file.read_text()
            frontmatter, body = parse_frontmatter(content)
            
            # Get title from frontmatter or filename
            title = frontmatter.get("title") or md_file.stem.replace("-", " ").title()
            
            # Get a preview (first 100 chars of content, stripped)
            preview = body.strip()[:150].replace("\n", " ").strip()
            if len(body.strip()) > 150:
                preview += "..."
            
            all_notes.append({
                "path": rel_path,
                "name": md_file.stem,
                "title": title,
                "folder": folder,
                "preview": preview,
                "modified_at": stat.st_mtime,
                "created_at": stat.st_ctime,
                "metadata": frontmatter,
            })
        except Exception:
            # Skip files we can't read
            continue
    
    # Sort by modification time (most recent first)
    all_notes.sort(key=lambda x: x["modified_at"], reverse=True)
    
    total = len(all_notes)
    paginated = all_notes[offset:offset + limit]
    
    return {
        "notes": paginated,
        "total": total,
        "has_more": offset + limit < total,
    }


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
    
    # Security: ensure path is within ~/donna-data
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


@router.put("/{path:path}")
async def update_note(path: str, body: NoteContent) -> dict[str, Any]:
    """
    Update a note's content.

    Args:
        path: Relative path to the note (e.g., "tasks/order-crib.md")
        body: Request body containing the new content

    Returns:
        Updated parsed note with frontmatter, content, and wiki links
    """
    # Ensure .md extension
    if not path.endswith(".md"):
        path = f"{path}.md"

    note_path = DONNA_DATA_DIR / path

    # Security: ensure path is within ~/donna-data
    try:
        note_path = note_path.resolve()
        if not str(note_path).startswith(str(DONNA_DATA_DIR.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
    except Exception:
        raise HTTPException(status_code=403, detail="Invalid path")

    if not note_path.exists():
        raise HTTPException(status_code=404, detail=f"Note not found: {path}")

    if not note_path.is_file():
        raise HTTPException(status_code=400, detail="Path is not a file")

    # Write the new content
    try:
        note_path.write_text(body.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error writing note: {e}")

    # Parse and return the updated note
    parsed = parse_note(body.content)

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
