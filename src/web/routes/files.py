"""
File watch WebSocket route.

Monitors donna-data directory for changes and broadcasts to connected clients.
"""

import asyncio
from pathlib import Path
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent

# Import config - handle both package and direct execution
try:
    from ...config import DONNA_DATA_DIR
except ImportError:
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from config import DONNA_DATA_DIR


router = APIRouter(tags=["files"])


class FileChangeHandler(FileSystemEventHandler):
    """
    Watchdog handler that queues file change events.
    """
    
    def __init__(self, loop: asyncio.AbstractEventLoop, queue: asyncio.Queue):
        self.loop = loop
        self.queue = queue
        self._base_dir = DONNA_DATA_DIR.resolve()
    
    def _get_relative_path(self, path: str) -> str | None:
        """Get path relative to donna-data, or None if outside."""
        try:
            abs_path = Path(path).resolve()
            rel_path = abs_path.relative_to(self._base_dir)
            return str(rel_path)
        except ValueError:
            return None
    
    def _should_ignore(self, path: str) -> bool:
        """Check if this path should be ignored."""
        # Ignore hidden files and directories
        parts = Path(path).parts
        return any(part.startswith(".") for part in parts)
    
    def _queue_event(self, event_type: str, path: str) -> None:
        """Queue an event for async processing."""
        if self._should_ignore(path):
            return
        
        rel_path = self._get_relative_path(path)
        if rel_path is None:
            return
        
        # Only track markdown files
        if not path.endswith(".md"):
            return
        
        try:
            self.loop.call_soon_threadsafe(
                self.queue.put_nowait,
                {"type": event_type, "path": rel_path}
            )
        except Exception:
            pass
    
    def on_created(self, event: FileSystemEvent) -> None:
        if not event.is_directory:
            self._queue_event("file_created", event.src_path)
    
    def on_modified(self, event: FileSystemEvent) -> None:
        if not event.is_directory:
            self._queue_event("file_changed", event.src_path)
    
    def on_deleted(self, event: FileSystemEvent) -> None:
        if not event.is_directory:
            self._queue_event("file_deleted", event.src_path)
    
    def on_moved(self, event: FileSystemEvent) -> None:
        if not event.is_directory:
            self._queue_event("file_deleted", event.src_path)
            if hasattr(event, "dest_path"):
                self._queue_event("file_created", event.dest_path)


# Global set of connected WebSocket clients for file watching
_file_watch_clients: Set[WebSocket] = set()
_observer: Observer | None = None
_event_queue: asyncio.Queue | None = None
_broadcast_task: asyncio.Task | None = None


async def _broadcast_events() -> None:
    """Background task to broadcast file events to all connected clients."""
    global _event_queue
    
    while True:
        try:
            event = await _event_queue.get()
            
            # Broadcast to all connected clients
            disconnected = set()
            for client in _file_watch_clients:
                try:
                    await client.send_json(event)
                except Exception:
                    disconnected.add(client)
            
            # Remove disconnected clients
            _file_watch_clients.difference_update(disconnected)
            
        except asyncio.CancelledError:
            break
        except Exception:
            pass


def _start_file_watcher() -> None:
    """Start the file watcher if not already running."""
    global _observer, _event_queue, _broadcast_task
    
    if _observer is not None:
        return
    
    loop = asyncio.get_event_loop()
    _event_queue = asyncio.Queue()
    
    handler = FileChangeHandler(loop, _event_queue)
    _observer = Observer()
    _observer.schedule(handler, str(DONNA_DATA_DIR), recursive=True)
    _observer.start()
    
    # Start broadcast task
    _broadcast_task = asyncio.create_task(_broadcast_events())


def _stop_file_watcher() -> None:
    """Stop the file watcher if no clients are connected."""
    global _observer, _broadcast_task
    
    if _file_watch_clients:
        return  # Still have clients
    
    if _observer:
        _observer.stop()
        _observer.join(timeout=1)
        _observer = None
    
    if _broadcast_task:
        _broadcast_task.cancel()
        _broadcast_task = None


@router.websocket("/ws/files")
async def file_watch_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for file change notifications.
    
    Clients connect to receive real-time updates when files
    in donna-data are created, modified, or deleted.
    
    Server sends:
    - {"type": "file_created", "path": "relative/path.md"}
    - {"type": "file_changed", "path": "relative/path.md"}
    - {"type": "file_deleted", "path": "relative/path.md"}
    - {"type": "connected", "watching": "donna-data"}
    """
    await websocket.accept()
    
    # Add to connected clients
    _file_watch_clients.add(websocket)
    
    # Start watcher if needed
    _start_file_watcher()
    
    # Send confirmation
    await websocket.send_json({
        "type": "connected",
        "watching": str(DONNA_DATA_DIR),
    })
    
    try:
        # Keep connection alive - just wait for disconnect
        while True:
            try:
                # Receive and ignore any messages (ping/pong handled by protocol)
                await websocket.receive_text()
            except WebSocketDisconnect:
                break
    finally:
        # Remove from connected clients
        _file_watch_clients.discard(websocket)
        
        # Stop watcher if no more clients
        _stop_file_watcher()
