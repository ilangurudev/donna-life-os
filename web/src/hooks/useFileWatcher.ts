import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import type { FileEvent } from '../types'

interface UseFileWatcherResult {
  isConnected: boolean
  lastChange: FileEvent | null
}

export function useFileWatcher(): UseFileWatcherResult {
  const [isConnected, setIsConnected] = useState(false)
  const [lastChange, setLastChange] = useState<FileEvent | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const status = useAuthStore((state) => state.status)

  useEffect(() => {
    // Only connect when authenticated
    if (status !== 'authenticated') {
      return
    }

    // Don't reconnect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/files`
    
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      console.log('[FileWatcher] Connected')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as FileEvent
        console.log('[FileWatcher] Event:', data)
        
        if (data.type !== 'connected') {
          setLastChange(data)
        }
      } catch (e) {
        console.error('[FileWatcher] Parse error:', e)
      }
    }

    ws.onclose = (event) => {
      setIsConnected(false)
      wsRef.current = null
      console.log('[FileWatcher] Disconnected', event.code, event.reason)
      
      // Don't reconnect on auth failure (403) - user needs to log in
      if (event.code === 1006 || event.code === 4001) {
        return
      }
      
      // Reconnect after 2 seconds for other failures, but only if still authenticated
      const currentStatus = useAuthStore.getState().status
      if (currentStatus === 'authenticated') {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          // Re-check auth before actually reconnecting
          if (useAuthStore.getState().status === 'authenticated') {
            // Trigger re-render to reconnect via effect
            setIsConnected(false)
          }
        }, 2000)
      }
    }

    ws.onerror = () => {
      // Error logging handled by onclose
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [status])

  return { isConnected, lastChange }
}
