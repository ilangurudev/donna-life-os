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
  const devModeRef = useRef(devMode)
  devModeRef.current = devMode

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // Get browser timezone (IANA format like "America/New_York")
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const wsUrl = `${protocol}//${window.location.host}/ws/chat?timezone=${encodeURIComponent(timezone)}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      // Ignore callbacks from stale WebSocket instances (React Strict Mode)
      if (ws !== wsRef.current) return
      useChatStore.getState().setConnected(true)
      console.log('[Chat] Connected')
    }

    ws.onmessage = (event) => {
      if (ws !== wsRef.current) return
      try {
        const data = JSON.parse(event.data) as ChatEvent
        const store = useChatStore.getState()

        switch (data.type) {
          case 'greeting_start':
            // Start the assistant message when backend confirms greeting
            store.startAssistantMessage()
            break

          case 'text':
            store.appendText(data.content)
            break

          case 'thinking':
            store.appendThinking(data.content)
            break

          case 'tool_use':
            store.addToolCall(data.name, data.input, data.toolId, data.parentToolUseId)
            break

          case 'tool_result':
            store.setToolResult(data.content, data.isError, data.toolUseId)
            break

          case 'permission_request':
            store.setPermissionRequest({ tool: data.tool, input: data.input })
            break

          case 'session_end':
            store.setSessionStats(data.stats)
            store.finalizeAssistantMessage()
            break

          case 'error':
            console.error('[Chat] Error:', data.message)
            store.finalizeAssistantMessage()
            break
        }
      } catch (e) {
        console.error('[Chat] Parse error:', e)
      }
    }

    ws.onclose = (event) => {
      if (ws !== wsRef.current) return
      const store = useChatStore.getState()
      store.setConnected(false)
      // If we were mid-response, finalize so the UI doesn't get stuck
      if (store.isLoading) {
        store.finalizeAssistantMessage()
      }
      console.log('[Chat] Disconnected', event.code, event.reason)

      // Handle authentication failure
      if (event.code === WS_CLOSE_AUTH_REQUIRED) {
        console.log('[Chat] Authentication required, refreshing auth state')
        useAuthStore.getState().checkAuth()
      }
    }

    ws.onerror = (error) => {
      if (ws !== wsRef.current) return
      console.error('[Chat] Error:', error)
    }
  }, [])

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      useChatStore.getState().addUserMessage(content)
      useChatStore.getState().startAssistantMessage()

      wsRef.current.send(JSON.stringify({
        type: 'message',
        content,
        devMode: devModeRef.current,
      }))
    }
  }, [])

  const respondToPermission = useCallback((allowed: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'permission_response',
        allowed,
      }))
      useChatStore.getState().setPermissionRequest(null)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return { sendMessage, respondToPermission, reconnect: connect }
}
