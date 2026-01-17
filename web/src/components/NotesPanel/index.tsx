import { useState } from 'react'
import { FileTree } from './FileTree'
import { NoteModal } from './NoteModal'
import { RecentNotesList } from './RecentNotesList'
import { useFileTree, useNote, useNoteRefresh } from '../../hooks/useNotes'
import { FolderOpen, Loader2, Clock, FolderTree } from 'lucide-react'
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
        {/* Notes list/tree */}
        <div className="flex-1 overflow-auto">
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
      </div>

      {/* Note modal */}
      {selectedNote && (
        <NoteModal
          note={note ?? undefined}
          isLoading={noteLoading}
          notePath={selectedNote}
          onClose={() => onSelectNote(null)}
          onNavigate={onSelectNote}
        />
      )}
    </div>
  )
}
