import { FileText, Loader2, X, Pencil, Save, XCircle } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { NoteViewer } from './NoteViewer'
import { NoteEditor } from './NoteEditor'
import { useSaveNote } from '../../hooks/useNotes'
import type { Note } from '../../types'

interface NoteModalProps {
  note: Note | undefined
  isLoading: boolean
  notePath: string
  onClose: () => void
  onNavigate: (path: string) => void
}

export function NoteModal({ note, isLoading, notePath, onClose, onNavigate }: NoteModalProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const saveNoteMutation = useSaveNote()

  // Track if content has been modified
  const isDirty = isEditMode && note && editedContent !== note.raw

  // Initialize edited content when note loads or changes
  useEffect(() => {
    if (note) {
      setEditedContent(note.raw)
    }
  }, [note])

  // Reset edit mode when modal closes
  useEffect(() => {
    return () => {
      setIsEditMode(false)
      setShowDiscardDialog(false)
    }
  }, [])

  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardDialog(true)
    } else {
      onClose()
    }
  }, [isDirty, onClose])

  const handleKeepEditing = useCallback(() => {
    setShowDiscardDialog(false)
  }, [])

  const handleSave = useCallback(async () => {
    if (!note || !isDirty) return

    try {
      await saveNoteMutation.mutateAsync({
        path: notePath,
        content: editedContent,
      })
      setIsEditMode(false)
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }, [note, isDirty, notePath, editedContent, saveNoteMutation])

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowDiscardDialog(true)
    } else {
      setIsEditMode(false)
      if (note) {
        setEditedContent(note.raw)
      }
    }
  }, [isDirty, note])

  const handleCancelDiscard = useCallback(() => {
    setShowDiscardDialog(false)
    setIsEditMode(false)
    if (note) {
      setEditedContent(note.raw)
    }
  }, [note])

  const handleEnterEditMode = useCallback(() => {
    setIsEditMode(true)
  }, [])

  // Close on escape key (with unsaved changes check)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDiscardDialog) {
          handleKeepEditing()
        } else {
          handleClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, handleKeepEditing, showDiscardDialog])

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
        if (e.target === e.currentTarget && !showDiscardDialog) handleClose()
      }}
    >
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-donna-bg-secondary border border-donna-border shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-donna-border px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 text-donna-accent flex-shrink-0" />
            <span className="text-sm text-donna-text truncate" title={notePath}>
              {notePath}
              {isDirty && <span className="text-donna-pink ml-1">*</span>}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-donna-text-muted hover:text-donna-text transition-colors rounded hover:bg-donna-surface"
                  disabled={saveNoteMutation.isPending}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isDirty || saveNoteMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-donna-accent text-donna-bg rounded hover:bg-donna-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveNoteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
              </>
            ) : (
              <>
                {note && (
                  <button
                    onClick={handleEnterEditMode}
                    className="text-donna-text-muted hover:text-donna-text transition-colors p-1 rounded hover:bg-donna-surface"
                    aria-label="Edit note"
                    title="Edit note"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="text-donna-text-muted hover:text-donna-text transition-colors p-1 rounded hover:bg-donna-surface"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-donna-text-muted" />
            </div>
          ) : note ? (
            isEditMode ? (
              <NoteEditor content={editedContent} onChange={setEditedContent} />
            ) : (
              <NoteViewer note={note} onNavigate={onNavigate} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-donna-text-muted">
              <FileText className="h-12 w-12 mb-3 opacity-50" />
              <p>Note not found</p>
            </div>
          )}
        </div>

        {/* Save error message */}
        {saveNoteMutation.isError && (
          <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-red-400 text-sm">
            Failed to save note. Please try again.
          </div>
        )}
      </div>

      {/* Unsaved Changes Dialog */}
      {showDiscardDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-donna-bg-secondary border border-donna-border rounded-lg p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-medium text-donna-text mb-2">
              Unsaved Changes
            </h3>
            <p className="text-donna-text-muted text-sm mb-6">
              You have unsaved changes. Do you want to discard them?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleKeepEditing}
                className="px-4 py-2 text-sm text-donna-text hover:bg-donna-surface rounded transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={handleCancelDiscard}
                className="px-4 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
