import { useState } from 'react'
import { NotesPanel } from './components/NotesPanel'
import { ChatPanel } from './components/ChatPanel'
import { SplitPane } from './components/Layout/SplitPane'
import { useFileWatcher } from './hooks/useFileWatcher'

function App() {
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const { lastChange } = useFileWatcher()

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
        defaultLeftWidth={350}
        minLeftWidth={250}
        maxLeftWidth={600}
      />
    </div>
  )
}

export default App
