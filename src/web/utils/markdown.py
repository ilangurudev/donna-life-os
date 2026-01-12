"""
Markdown utilities for parsing frontmatter and wiki links.
"""

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass
class ParsedNote:
    """Parsed markdown note with frontmatter and content separated."""
    
    frontmatter: dict[str, Any]
    content: str
    wiki_links: list[str]
    raw: str


def parse_frontmatter(content: str) -> tuple[dict[str, Any], str]:
    """
    Parse YAML frontmatter from markdown content.
    
    Args:
        content: Raw markdown content
        
    Returns:
        Tuple of (frontmatter dict, content without frontmatter)
    """
    if not content.startswith("---"):
        return {}, content
    
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content
    
    try:
        frontmatter = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        frontmatter = {}
    
    # Content is everything after the second ---
    body = parts[2].lstrip("\n")
    
    return frontmatter, body


def extract_wiki_links(content: str) -> list[str]:
    """
    Extract wiki-style links [[link]] from markdown content.
    
    Args:
        content: Markdown content
        
    Returns:
        List of link targets (without brackets)
    """
    pattern = r"\[\[([^\]]+)\]\]"
    matches = re.findall(pattern, content)
    return list(set(matches))  # Deduplicate


def parse_note(content: str) -> ParsedNote:
    """
    Parse a markdown note into its components.
    
    Args:
        content: Raw markdown content
        
    Returns:
        ParsedNote with frontmatter, content, and wiki links
    """
    frontmatter, body = parse_frontmatter(content)
    wiki_links = extract_wiki_links(content)
    
    return ParsedNote(
        frontmatter=frontmatter,
        content=body,
        wiki_links=wiki_links,
        raw=content,
    )


def resolve_wiki_link(link: str, notes_dir: Path) -> str | None:
    """
    Resolve a wiki link to a file path.
    
    Wiki links can be:
    - Simple names: [[Baby Prep]] -> baby-prep.md (searches all dirs)
    - With path: [[tasks/order-crib]] -> tasks/order-crib.md
    
    Args:
        link: The wiki link text (without brackets)
        notes_dir: Base directory for notes (donna-data)
        
    Returns:
        Relative path to the file, or None if not found
    """
    # Normalize the link: lowercase, replace spaces with hyphens
    normalized = link.lower().replace(" ", "-")
    
    # If it contains a path separator, try direct match
    if "/" in normalized:
        target = notes_dir / f"{normalized}.md"
        if target.exists():
            return str(target.relative_to(notes_dir))
    
    # Search all directories for a matching file
    for md_file in notes_dir.rglob("*.md"):
        stem = md_file.stem.lower()
        if stem == normalized:
            return str(md_file.relative_to(notes_dir))
    
    return None


def build_file_tree(notes_dir: Path) -> dict:
    """
    Build a tree structure of the notes directory.
    
    Args:
        notes_dir: Base directory for notes
        
    Returns:
        Nested dict representing the file tree
    """
    def build_node(path: Path, base: Path) -> dict | None:
        # Skip hidden files and directories
        if path.name.startswith("."):
            return None
        
        rel_path = str(path.relative_to(base))
        
        if path.is_file():
            if not path.suffix == ".md":
                return None
            
            # Parse frontmatter for metadata
            try:
                content = path.read_text()
                frontmatter, _ = parse_frontmatter(content)
            except Exception:
                frontmatter = {}
            
            return {
                "type": "file",
                "name": path.stem,
                "path": rel_path,
                "metadata": frontmatter,
            }
        
        elif path.is_dir():
            children = []
            for child in sorted(path.iterdir()):
                node = build_node(child, base)
                if node:
                    children.append(node)
            
            # Skip empty directories
            if not children:
                return None
            
            return {
                "type": "directory",
                "name": path.name,
                "path": rel_path,
                "children": children,
            }
        
        return None
    
    # Build tree from root
    children = []
    for child in sorted(notes_dir.iterdir()):
        node = build_node(child, notes_dir)
        if node:
            children.append(node)
    
    return {
        "type": "directory",
        "name": "donna-data",
        "path": "",
        "children": children,
    }
