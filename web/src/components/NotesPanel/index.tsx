import { useState } from 'react'
import { FileTree } from './FileTree'
import { NoteViewer } from './NoteViewer'
import { RecentNotesList } from './RecentNotesList'
import { useFileTree, useNote, useNoteRefresh } from '../../hooks/useNotes'
import { FolderOpen, FileText, Loader2, Clock, FolderTree, X } from 'lucide-react'
import clsx from 'clsx'
import type { FileEvent } from '../../types'

type ViewMode = 'recent' | 'tree'

interface NotesPanelProps {
  selectedNote: string | null
  onSelectNote: (path: string | null) => void
  lastChange: FileEvent | null
}

export function NotesPanel({ selectedNote, onSelectNote, lastChange }: NotesPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('recent')
  const { data: fileTree, isLoading: treeLoading } = useFileTree()
  const { data: note, isLoading: noteLoading } = useNote(selectedNote)
  
  // Refresh notes when files change
  useNoteRefresh(lastChange)

  return (
    <div className="flex h-full flex-col bg-donna-bg-secondary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-donna-border px-4 py-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-donna-accent" />
          <h2 className="font-semibold text-donna-text">Notes</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {lastChange && lastChange.type !== 'connected' && (
            <span className="text-xs text-donna-cyan animate-fade-in">
              Updated
            </span>
          )}
          
          {/* View mode toggle */}
          <div className="flex items-center bg-donna-surface rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('recent')}
              className={clsx(
                'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                viewMode === 'recent'
                  ? 'bg-donna-accent text-donna-bg'
                  : 'text-donna-text-muted hover:text-donna-text'
              )}
              title="Recent notes"
            >
              <Clock className="h-3 w-3" />
              <span>Recent</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={clsx(
                'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                viewMode === 'tree'
                  ? 'bg-donna-accent text-donna-bg'
                  : 'text-donna-text-muted hover:text-donna-text'
              )}
              title="Folder tree"
            >
              <FolderTree className="h-3 w-3" />
              <span>Folders</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Notes list/tree - upper section */}
        <div className={clsx(
          'flex-shrink-0 border-b border-donna-border overflow-auto',
          selectedNote ? 'max-h-48' : 'flex-1'
        )}>
          {viewMode === 'recent' ? (
            <RecentNotesList
              onSelectNote={onSelectNote}
              selectedNote={selectedNote}
              lastChange={lastChange}
              className="h-full"
            />
          ) : treeLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-donna-text-muted" />
            </div>
          ) : fileTree ? (
            <FileTree
              node={fileTree}
              selectedPath={selectedNote}
              onSelect={onSelectNote}
              level={0}
            />
          ) : (
            <div className="p-4 text-sm text-donna-text-muted">
              No notes found
            </div>
          )}
        </div>

        {/* Note viewer - lower section, only when a note is selected */}
        {selectedNote && (
          <div className="flex-1 overflow-auto min-h-0">
            {/* Viewer header with close button */}
            <div className="sticky top-0 bg-donna-bg-secondary border-b border-donna-border/50 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-donna-text-muted truncate">
                {selectedNote}
              </span>
              <button
                onClick={() => onSelectNote(null)}
                className="p-1 rounded hover:bg-donna-surface text-donna-text-muted hover:text-donna-text"
                title="Close note"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {noteLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-donna-text-muted" />
              </div>
            ) : note ? (
              <NoteViewer note={note} onNavigate={onSelectNote} />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-donna-text-muted">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
                <p>Note not found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
