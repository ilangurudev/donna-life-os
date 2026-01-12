import { useEffect, useState, useRef, useCallback } from 'react'
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

    ws.onclose = () => {
      setIsConnected(false)
      console.log('[FileWatcher] Disconnected, reconnecting...')
      
      // Reconnect after 2 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect()
      }, 2000)
    }

    ws.onerror = (error) => {
      console.error('[FileWatcher] Error:', error)
    }
  }, [])

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
