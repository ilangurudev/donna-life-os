import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import type { FileNode, Note, FileEvent, RecentNotesResponse } from '../types'

/**
 * Handle API response and check for auth errors.
 * Returns the response if ok, otherwise throws with auth handling.
 */
async function handleApiResponse(response: Response, checkAuth: () => Promise<void>) {
  if (response.status === 401) {
    // Authentication required - refresh auth state
    await checkAuth()
    throw new Error('Authentication required')
  }
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response
}

async function fetchFileTree(checkAuth: () => Promise<void>): Promise<FileNode> {
  const response = await fetch('/api/notes', { credentials: 'include' })
  await handleApiResponse(response, checkAuth)
  return response.json()
}

async function fetchNote(path: string, checkAuth: () => Promise<void>): Promise<Note> {
  const response = await fetch(`/api/notes/${path}`, { credentials: 'include' })
  await handleApiResponse(response, checkAuth)
  return response.json()
}

async function fetchRecentNotes(
  limit: number,
  offset: number,
  checkAuth: () => Promise<void>
): Promise<RecentNotesResponse> {
  const response = await fetch(`/api/notes/recent?limit=${limit}&offset=${offset}`, {
    credentials: 'include',
  })
  await handleApiResponse(response, checkAuth)
  return response.json()
}

export function useFileTree() {
  const { checkAuth } = useAuthStore()
  
  return useQuery({
    queryKey: ['notes', 'tree'],
    queryFn: () => fetchFileTree(checkAuth),
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message === 'Authentication required') return false
      return failureCount < 3
    },
  })
}

export function useNote(path: string | null) {
  const { checkAuth } = useAuthStore()
  
  return useQuery({
    queryKey: ['notes', 'note', path],
    queryFn: () => (path ? fetchNote(path, checkAuth) : null),
    enabled: !!path,
    retry: (failureCount, error) => {
      if (error.message === 'Authentication required') return false
      return failureCount < 3
    },
  })
}

export function useRecentNotes(limit: number = 50) {
  const { checkAuth } = useAuthStore()
  
  return useInfiniteQuery({
    queryKey: ['notes', 'recent', limit],
    queryFn: ({ pageParam = 0 }) => fetchRecentNotes(limit, pageParam, checkAuth),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.has_more) return undefined
      return allPages.length * limit
    },
    initialPageParam: 0,
    retry: (failureCount, error) => {
      if (error.message === 'Authentication required') return false
      return failureCount < 3
    },
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
