import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { FileNode, Note, FileEvent } from '../types'

async function fetchFileTree(): Promise<FileNode> {
  const response = await fetch('/api/notes')
  if (!response.ok) throw new Error('Failed to fetch notes')
  return response.json()
}

async function fetchNote(path: string): Promise<Note> {
  const response = await fetch(`/api/notes/${path}`)
  if (!response.ok) throw new Error('Failed to fetch note')
  return response.json()
}

export function useFileTree() {
  return useQuery({
    queryKey: ['notes', 'tree'],
    queryFn: fetchFileTree,
  })
}

export function useNote(path: string | null) {
  return useQuery({
    queryKey: ['notes', 'note', path],
    queryFn: () => (path ? fetchNote(path) : null),
    enabled: !!path,
  })
}

export function useNoteRefresh(lastChange: FileEvent | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!lastChange) return

    if (lastChange.type === 'file_changed') {
      // Invalidate the specific note
      queryClient.invalidateQueries({
        queryKey: ['notes', 'note', lastChange.path],
      })
    }

    if (
      lastChange.type === 'file_created' ||
      lastChange.type === 'file_deleted'
    ) {
      // Invalidate the tree and the specific note
      queryClient.invalidateQueries({ queryKey: ['notes', 'tree'] })
      queryClient.invalidateQueries({
        queryKey: ['notes', 'note', lastChange.path],
      })
    }
  }, [lastChange, queryClient])
}
