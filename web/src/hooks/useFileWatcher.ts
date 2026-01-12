import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import type { FileEvent } from '../types'

// WebSocket close codes
const WS_CLOSE_AUTH_REQUIRED = 4001

interface UseFileWatcherResult {
  isConnected: boolean
  lastChange: FileEvent | null
}

export function useFileWatcher(): UseFileWatcherResult {
  const [isConnected, setIsConnected] = useState(false)
  const [lastChange, setLastChange] = useState<FileEvent | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const { checkAuth } = useAuthStore()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

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
      console.log('[FileWatcher] Disconnected', event.code, event.reason)
      
      // Handle authentication failure
      if (event.code === WS_CLOSE_AUTH_REQUIRED) {
        console.log('[FileWatcher] Authentication required, refreshing auth state')
        checkAuth()
        return // Don't reconnect - auth UI will handle it
      }
      
      // Reconnect after 2 seconds (for non-auth failures)
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect()
      }, 2000)
    }

    ws.onerror = (error) => {
      console.error('[FileWatcher] Error:', error)
    }
  }, [checkAuth])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { isConnected, lastChange }
}
