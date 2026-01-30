import { create } from 'zustand'
import type { ChatMessage, SessionStats, PermissionRequest } from '../types'

interface ChatState {
  messages: ChatMessage[]
  currentMessage: Partial<ChatMessage> | null
  currentToolId: string | null  // Track which tool gets results
  isConnected: boolean
  isLoading: boolean
  sessionStats: SessionStats | null
  permissionRequest: PermissionRequest | null

  // Actions
  addUserMessage: (content: string) => void
  startAssistantMessage: () => void
  appendText: (text: string) => void
  appendThinking: (thinking: string) => void
  addToolCall: (name: string, input: Record<string, unknown>, toolId?: string, parentToolUseId?: string | null) => void
  setToolResult: (result: string, isError: boolean, toolUseId?: string) => void
  finalizeAssistantMessage: () => void
  setConnected: (connected: boolean) => void
  setLoading: (loading: boolean) => void
  setSessionStats: (stats: SessionStats) => void
  setPermissionRequest: (request: PermissionRequest | null) => void
  clearMessages: () => void
}

let messageIdCounter = 0
let toolIdCounter = 0

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentMessage: null,
  currentToolId: null,
  isConnected: false,
  isLoading: false,
  sessionStats: null,
  permissionRequest: null,

  addUserMessage: (content: string) => {
    const message: ChatMessage = {
      id: `msg-${++messageIdCounter}`,
      role: 'user',
      blocks: [{ type: 'text', content }],
      timestamp: new Date(),
    }
    set((state) => ({ messages: [...state.messages, message] }))
  },

  startAssistantMessage: () => {
    set({
      currentMessage: {
        id: `msg-${++messageIdCounter}`,
        role: 'assistant',
        blocks: [],
        timestamp: new Date(),
      },
      currentToolId: null,
      isLoading: true,
    })
  },

  appendText: (text: string) => {
    set((state) => {
      if (!state.currentMessage) return state

      const blocks = [...(state.currentMessage.blocks || [])]
      const lastBlock = blocks[blocks.length - 1]

      // Merge with last text block if consecutive
      if (lastBlock?.type === 'text') {
        blocks[blocks.length - 1] = { ...lastBlock, content: lastBlock.content + text }
      } else {
        blocks.push({ type: 'text', content: text })
      }

      return { currentMessage: { ...state.currentMessage, blocks } }
    })
  },

  appendThinking: (thinking: string) => {
    set((state) => {
      if (!state.currentMessage) return state

      const blocks = [...(state.currentMessage.blocks || [])]
      const lastBlock = blocks[blocks.length - 1]

      // Merge with last thinking block if consecutive
      if (lastBlock?.type === 'thinking') {
        blocks[blocks.length - 1] = { ...lastBlock, content: lastBlock.content + thinking }
      } else {
        blocks.push({ type: 'thinking', content: thinking })
      }

      return { currentMessage: { ...state.currentMessage, blocks } }
    })
  },

  addToolCall: (name: string, input: Record<string, unknown>, sdkToolId?: string, parentToolUseId?: string | null) => {
    const localId = `tool-${++toolIdCounter}`
    set((state) => {
      if (!state.currentMessage) return state

      const blocks = [...(state.currentMessage.blocks || [])]
      blocks.push({ type: 'tool_use', id: localId, name, input, toolId: sdkToolId, parentToolUseId })

      return {
        currentMessage: { ...state.currentMessage, blocks },
        currentToolId: localId,
      }
    })
  },

  setToolResult: (result: string, isError: boolean, toolUseId?: string) => {
    set((state) => {
      if (!state.currentMessage?.blocks?.length) return state

      // Match by SDK toolUseId if provided, otherwise fall back to currentToolId
      const matchId = toolUseId
        ? undefined  // will match by toolId field
        : state.currentToolId

      const blocks = state.currentMessage.blocks.map((block) => {
        if (block.type === 'tool_use') {
          if (toolUseId && block.toolId === toolUseId) {
            return { ...block, result, isError }
          }
          if (!toolUseId && block.id === matchId) {
            return { ...block, result, isError }
          }
        }
        return block
      })

      return { currentMessage: { ...state.currentMessage, blocks } }
    })
  },

  finalizeAssistantMessage: () => {
    const { currentMessage } = get()
    // Finalize only if blocks contain actual content (not just empty text)
    const hasContent = currentMessage?.blocks?.some(block => {
      if (block.type === 'text') return block.content?.trim().length > 0
      return true // thinking and tool blocks always count
    })
    if (currentMessage && currentMessage.blocks && currentMessage.blocks.length > 0 && hasContent) {
      set((state) => ({
        messages: [...state.messages, currentMessage as ChatMessage],
        currentMessage: null,
        currentToolId: null,
        isLoading: false,
      }))
    } else {
      set({ currentMessage: null, currentToolId: null, isLoading: false })
    }
  },

  setConnected: (connected: boolean) => set({ isConnected: connected }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setSessionStats: (stats: SessionStats) => set({ sessionStats: stats }),
  setPermissionRequest: (request: PermissionRequest | null) => set({ permissionRequest: request }),
  clearMessages: () => set({ messages: [], currentMessage: null, currentToolId: null, sessionStats: null }),
}))
