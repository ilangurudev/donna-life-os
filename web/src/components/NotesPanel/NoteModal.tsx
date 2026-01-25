import { FileText, Loader2, X } from 'lucide-react'
import { useEffect } from 'react'
import { NoteViewer } from './NoteViewer'
import type { Note } from '../../types'

interface NoteModalProps {
  note: Note | undefined
  isLoading: boolean
  notePath: string
  onClose: () => void
  onNavigate: (path: string) => void
}

export function NoteModal({ note, isLoading, notePath, onClose, onNavigate }: NoteModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-donna-bg-secondary border border-donna-border shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-donna-border px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 text-donna-accent flex-shrink-0" />
            <span className="text-sm text-donna-text truncate" title={notePath}>
              {notePath}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-donna-text-muted hover:text-donna-text transition-colors p-1 rounded hover:bg-donna-surface flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-donna-text-muted" />
            </div>
          ) : note ? (
            <NoteViewer note={note} onNavigate={onNavigate} />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-donna-text-muted">
              <FileText className="h-12 w-12 mb-3 opacity-50" />
              <p>Note not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
