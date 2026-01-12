import { FolderOpen } from 'lucide-react'
import { RecentNotesList } from './RecentNotesList'
import { MobileNoteViewer } from './MobileNoteViewer'
import { useMobileNav } from '../../stores/useMobileNav'
import type { FileEvent } from '../../types'

interface MobileNotesViewProps {
  lastChange: FileEvent | null
}

export function MobileNotesView({ lastChange }: MobileNotesViewProps) {
  const { currentView, selectedNotePath, openNote, closeNote } = useMobileNav()

  // If viewing a note, show the full-screen viewer
  if (currentView === 'note-detail' && selectedNotePath) {
    return (
      <MobileNoteViewer
        path={selectedNotePath}
        onBack={closeNote}
        onNavigate={openNote}
      />
    )
  }

  // Otherwise show the notes list
  return (
    <div className="flex flex-col h-full bg-donna-bg-secondary">
      {/* Header */}
      <div className="mobile-header">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-donna-accent" />
          <h1 className="font-semibold text-donna-text">Notes</h1>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-hidden mobile-content">
        <RecentNotesList
          onSelectNote={openNote}
          selectedNote={selectedNotePath}
          lastChange={lastChange}
        />
      </div>
    </div>
  )
}
