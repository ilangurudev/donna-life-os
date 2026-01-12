import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { FileNode, Note, FileEvent, RecentNotesResponse } from '../types'

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

async function fetchRecentNotes(
  limit: number,
  offset: number
): Promise<RecentNotesResponse> {
  const response = await fetch(`/api/notes/recent?limit=${limit}&offset=${offset}`)
  if (!response.ok) throw new Error('Failed to fetch recent notes')
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

export function useRecentNotes(limit: number = 50) {
  return useInfiniteQuery({
    queryKey: ['notes', 'recent', limit],
    queryFn: ({ pageParam = 0 }) => fetchRecentNotes(limit, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.has_more) return undefined
      return allPages.length * limit
    },
    initialPageParam: 0,
  })
}

export function useNoteRefresh(lastChange: FileEvent | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!lastChange) return

    if (lastChange.type === 'file_changed') {
      // Invalidate the specific note and recent notes list
      queryClient.invalidateQueries({
        queryKey: ['notes', 'note', lastChange.path],
      })
      queryClient.invalidateQueries({
        queryKey: ['notes', 'recent'],
      })
    }

    if (
      lastChange.type === 'file_created' ||
      lastChange.type === 'file_deleted'
    ) {
      // Invalidate everything
      queryClient.invalidateQueries({ queryKey: ['notes', 'tree'] })
      queryClient.invalidateQueries({ queryKey: ['notes', 'recent'] })
      queryClient.invalidateQueries({
        queryKey: ['notes', 'note', lastChange.path],
      })
    }
  }, [lastChange, queryClient])
}
