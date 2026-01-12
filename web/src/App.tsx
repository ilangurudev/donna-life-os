import { useState } from 'react'
import { NotesPanel } from './components/NotesPanel'
import { ChatPanel } from './components/ChatPanel'
import { SplitPane, MobileTabBar } from './components/Layout'
import { MobileNotesView } from './components/NotesPanel/MobileNotesView'
import { useFileWatcher, useIsMobile } from './hooks'
import { useMobileNav } from './stores/useMobileNav'
import type { MobileView } from './types'

function App() {
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const { lastChange } = useFileWatcher()
  const isMobile = useIsMobile()
  const { currentView, setView } = useMobileNav()

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-donna-bg">
        {/* Main content area */}
        <div className="h-full">
          {currentView === 'chat' && <ChatPanel isMobile />}
          {(currentView === 'notes' || currentView === 'note-detail') && (
            <MobileNotesView lastChange={lastChange} />
          )}
        </div>

        {/* Tab bar - hidden when viewing a note detail */}
        {currentView !== 'note-detail' && (
          <MobileTabBar
            currentView={currentView}
            onViewChange={(view: MobileView) => setView(view)}
          />
        )}
      </div>
    )
  }

  // Desktop layout - Notes take 60% by default, draggable from 20% to 80%
  return (
    <div className="h-screen w-screen overflow-hidden bg-donna-bg">
      <SplitPane
        left={
          <NotesPanel
            selectedNote={selectedNote}
            onSelectNote={setSelectedNote}
            lastChange={lastChange}
          />
        }
        right={<ChatPanel />}
        defaultLeftPercent={40}
        minLeftPercent={20}
        maxLeftPercent={80}
      />
    </div>
  )
}

export default App
