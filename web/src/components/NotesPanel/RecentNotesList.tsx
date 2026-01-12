import { useState, useMemo } from 'react'
import { Search, FileText, Folder, Loader2, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { useRecentNotes, useNoteRefresh } from '../../hooks/useNotes'
import type { RecentNote, FileEvent } from '../../types'

interface RecentNotesListProps {
  onSelectNote: (path: string) => void
  selectedNote: string | null
  lastChange: FileEvent | null
  className?: string
}

export function RecentNotesList({
  onSelectNote,
  selectedNote,
  lastChange,
  className,
}: RecentNotesListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useRecentNotes(50)

  // Refresh on file changes
  useNoteRefresh(lastChange)

  // Flatten all pages into a single array
  const allNotes = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.notes)
  }, [data])

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return allNotes
    const query = searchQuery.toLowerCase()
    return allNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.preview.toLowerCase().includes(query) ||
        note.folder?.toLowerCase().includes(query)
    )
  }, [allNotes, searchQuery])

  const totalCount = data?.pages[0]?.total ?? 0

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Search bar */}
      <div className="p-3 border-b border-donna-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-donna-text-muted" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mobile-search pl-10"
          />
        </div>
        {totalCount > 0 && (
          <p className="text-xs text-donna-text-muted mt-2">
            {searchQuery
              ? `${filteredNotes.length} of ${totalCount} notes`
              : `${totalCount} notes`}
          </p>
        )}
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-donna-text-muted" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-donna-text-muted">
            <FileText className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">
              {searchQuery ? 'No notes match your search' : 'No notes yet'}
            </p>
          </div>
        ) : (
          <>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.path}
                note={note}
                isSelected={selectedNote === note.path}
                onClick={() => onSelectNote(note.path)}
              />
            ))}

            {/* Load more button */}
            {hasNextPage && !searchQuery && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-4 text-sm text-donna-accent hover:text-donna-accent-hover 
                           flex items-center justify-center gap-2 border-t border-donna-border"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Load more notes
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface NoteCardProps {
  note: RecentNote
  isSelected: boolean
  onClick: () => void
}

function NoteCard({ note, isSelected, onClick }: NoteCardProps) {
  const relativeTime = formatRelativeTime(note.modified_at * 1000)
  const statusColor = getStatusColor(note.metadata?.status as string)

  return (
    <button
      onClick={onClick}
      className={clsx(
        'note-card w-full text-left',
        isSelected && 'bg-donna-surface/70'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className={clsx('h-4 w-4 flex-shrink-0', statusColor)} />
          <span className="font-medium text-donna-text truncate">
            {note.title}
          </span>
        </div>
        <span className="relative-time flex-shrink-0">{relativeTime}</span>
      </div>

      {note.folder && (
        <div className="flex items-center gap-1 mt-1">
          <Folder className="h-3 w-3 text-donna-yellow" />
          <span className="text-xs text-donna-text-muted capitalize">
            {note.folder}
          </span>
        </div>
      )}

      {note.preview && (
        <p className="text-sm text-donna-text-secondary mt-1 line-clamp-2">
          {note.preview}
        </p>
      )}

      {/* Status and priority badges */}
      {(note.metadata?.status !== undefined || note.metadata?.priority === 'high') && (
        <div className="flex items-center gap-2 mt-2">
          {note.metadata?.status !== undefined && (
            <span className={clsx('folder-badge', getStatusBgColor(String(note.metadata.status)))}>
              {String(note.metadata.status)}
            </span>
          )}
          {note.metadata?.priority === 'high' && (
            <span className="folder-badge bg-donna-red/20 text-donna-red">
              High Priority
            </span>
          )}
        </div>
      )}
    </button>
  )
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getStatusColor(status?: string): string {
  switch (status) {
    case 'active':
      return 'text-donna-green'
    case 'todo':
      return 'text-donna-yellow'
    case 'done':
    case 'completed':
      return 'text-donna-text-muted'
    case 'blocked':
      return 'text-donna-red'
    default:
      return 'text-donna-accent'
  }
}

function getStatusBgColor(status?: string): string {
  switch (status) {
    case 'active':
      return 'bg-donna-green/20 text-donna-green'
    case 'todo':
      return 'bg-donna-yellow/20 text-donna-yellow'
    case 'done':
    case 'completed':
      return 'bg-donna-surface text-donna-text-muted'
    case 'blocked':
      return 'bg-donna-red/20 text-donna-red'
    default:
      return ''
  }
}
