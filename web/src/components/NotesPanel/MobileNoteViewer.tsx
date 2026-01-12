import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import { NoteViewer } from './NoteViewer'
import { useNote } from '../../hooks/useNotes'

interface MobileNoteViewerProps {
  path: string
  onBack: () => void
  onNavigate: (path: string) => void
}

export function MobileNoteViewer({ path, onBack, onNavigate }: MobileNoteViewerProps) {
  const { data: note, isLoading } = useNote(path)

  // Get the note title from the path
  const noteTitle = path
    .split('/')
    .pop()
    ?.replace('.md', '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Note'

  return (
    <div className="flex flex-col h-full bg-donna-bg animate-slide-in-right">
      {/* Header */}
      <div className="mobile-header">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-donna-accent touch-target"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Notes</span>
        </button>
        <h1 className="text-sm font-semibold text-donna-text truncate max-w-[200px]">
          {noteTitle}
        </h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto mobile-content-no-tabs">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-donna-text-muted" />
          </div>
        ) : note ? (
          <NoteViewer note={note} onNavigate={onNavigate} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-donna-text-muted">
            <FileText className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Note not found</p>
          </div>
        )}
      </div>
    </div>
  )
}
