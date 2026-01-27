import { useEffect, useRef, useCallback } from 'react'
import { useChatStore } from '../stores/useChatStore'
import { useAuthStore } from '../stores/useAuthStore'
import { useDevMode } from '../stores/useDevMode'
import type { ChatEvent } from '../types'

// WebSocket close codes
const WS_CLOSE_AUTH_REQUIRED = 4001

export function useChatWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const { devMode } = useDevMode()
  
  const {
    setConnected,
    startAssistantMessage,
    appendText,
    appendThinking,
    addToolCall,
    setToolResult,
    finalizeAssistantMessage,
    setSessionStats,
    setPermissionRequest,
  } = useChatStore()

  const { checkAuth } = useAuthStore()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // Get browser timezone (IANA format like "America/New_York")
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const wsUrl = `${protocol}//${window.location.host}/ws/chat?timezone=${encodeURIComponent(timezone)}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      console.log('[Chat] Connected')
      // Agent will automatically send greeting
      startAssistantMessage()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ChatEvent
        
        switch (data.type) {
          case 'greeting_start':
            // Already started assistant message on connect
            break
            
          case 'text':
            appendText(data.content)
            break
            
          case 'thinking':
            appendThinking(data.content)
            break
            
          case 'tool_use':
            addToolCall(data.name, data.input)
            break
            
          case 'tool_result':
            setToolResult(data.content, data.isError)
            break
            
          case 'permission_request':
            setPermissionRequest({ tool: data.tool, input: data.input })
            break
            
          case 'session_end':
            setSessionStats(data.stats)
            finalizeAssistantMessage()
            break
            
          case 'error':
            console.error('[Chat] Error:', data.message)
            finalizeAssistantMessage()
            break
        }
      } catch (e) {
        console.error('[Chat] Parse error:', e)
      }
    }

    ws.onclose = (event) => {
      setConnected(false)
      console.log('[Chat] Disconnected', event.code, event.reason)
      
      // Handle authentication failure
      if (event.code === WS_CLOSE_AUTH_REQUIRED) {
        console.log('[Chat] Authentication required, refreshing auth state')
        // Re-check auth status - this will update the UI to show login if needed
        checkAuth()
      }
    }

    ws.onerror = (error) => {
      console.error('[Chat] Error:', error)
    }
  }, [
    setConnected,
    startAssistantMessage,
    appendText,
    appendThinking,
    addToolCall,
    setToolResult,
    finalizeAssistantMessage,
    setSessionStats,
    setPermissionRequest,
    checkAuth,
  ])

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      useChatStore.getState().addUserMessage(content)
      startAssistantMessage()
      
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content,
        devMode,
      }))
    }
  }, [devMode, startAssistantMessage])

  const respondToPermission = useCallback((allowed: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'permission_response',
        allowed,
      }))
      setPermissionRequest(null)
    }
  }, [setPermissionRequest])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { sendMessage, respondToPermission, reconnect: connect }
}
