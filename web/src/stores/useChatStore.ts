import { create } from 'zustand'
import type { ChatMessage, SessionStats, PermissionRequest } from '../types'

interface ChatState {
  messages: ChatMessage[]
  currentMessage: Partial<ChatMessage> | null
  isConnected: boolean
  isLoading: boolean
  sessionStats: SessionStats | null
  permissionRequest: PermissionRequest | null
  
  // Actions
  addUserMessage: (content: string) => void
  startAssistantMessage: () => void
  appendText: (text: string) => void
  setThinking: (thinking: string) => void
  addToolCall: (name: string, input: Record<string, unknown>) => void
  setToolResult: (result: string, isError: boolean) => void
  finalizeAssistantMessage: () => void
  setConnected: (connected: boolean) => void
  setLoading: (loading: boolean) => void
  setSessionStats: (stats: SessionStats) => void
  setPermissionRequest: (request: PermissionRequest | null) => void
  clearMessages: () => void
}

let messageIdCounter = 0

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentMessage: null,
  isConnected: false,
  isLoading: false,
  sessionStats: null,
  permissionRequest: null,

  addUserMessage: (content: string) => {
    const message: ChatMessage = {
      id: `msg-${++messageIdCounter}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }
    set((state) => ({ messages: [...state.messages, message] }))
  },

  startAssistantMessage: () => {
    set({
      currentMessage: {
        id: `msg-${++messageIdCounter}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        toolCalls: [],
      },
      isLoading: true,
    })
  },

  appendText: (text: string) => {
    set((state) => ({
      currentMessage: state.currentMessage
        ? { ...state.currentMessage, content: (state.currentMessage.content || '') + text }
        : null,
    }))
  },

  setThinking: (thinking: string) => {
    set((state) => ({
      currentMessage: state.currentMessage
        ? { ...state.currentMessage, thinking }
        : null,
    }))
  },

  addToolCall: (name: string, input: Record<string, unknown>) => {
    set((state) => {
      if (!state.currentMessage) return state
      const toolCalls = [...(state.currentMessage.toolCalls || []), { name, input }]
      return { currentMessage: { ...state.currentMessage, toolCalls } }
    })
  },

  setToolResult: (result: string, isError: boolean) => {
    set((state) => {
      if (!state.currentMessage?.toolCalls?.length) return state
      const toolCalls = [...state.currentMessage.toolCalls]
      const lastTool = toolCalls[toolCalls.length - 1]
      toolCalls[toolCalls.length - 1] = { ...lastTool, result, isError }
      return { currentMessage: { ...state.currentMessage, toolCalls } }
    })
  },

  finalizeAssistantMessage: () => {
    const { currentMessage } = get()
    if (currentMessage && currentMessage.content) {
      set((state) => ({
        messages: [...state.messages, currentMessage as ChatMessage],
        currentMessage: null,
        isLoading: false,
      }))
    } else {
      set({ currentMessage: null, isLoading: false })
    }
  },

  setConnected: (connected: boolean) => set({ isConnected: connected }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setSessionStats: (stats: SessionStats) => set({ sessionStats: stats }),
  setPermissionRequest: (request: PermissionRequest | null) => set({ permissionRequest: request }),
  clearMessages: () => set({ messages: [], currentMessage: null, sessionStats: null }),
}))
