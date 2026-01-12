import { FileTree } from './FileTree'
import { NoteViewer } from './NoteViewer'
import { useFileTree, useNote, useNoteRefresh } from '../../hooks/useNotes'
import { FolderOpen, FileText, Loader2 } from 'lucide-react'
import type { FileEvent } from '../../types'

interface NotesPanelProps {
  selectedNote: string | null
  onSelectNote: (path: string | null) => void
  lastChange: FileEvent | null
}

export function NotesPanel({ selectedNote, onSelectNote, lastChange }: NotesPanelProps) {
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
        {lastChange && lastChange.type !== 'connected' && (
          <span className="text-xs text-donna-cyan animate-fade-in">
            Updated
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* File tree */}
        <div className="flex-shrink-0 border-b border-donna-border overflow-auto max-h-64">
          {treeLoading ? (
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

        {/* Note viewer */}
        <div className="flex-1 overflow-auto">
          {selectedNote ? (
            noteLoading ? (
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
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-donna-text-muted">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Select a note to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
