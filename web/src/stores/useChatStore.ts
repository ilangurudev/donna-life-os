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

  addToolCall: (name: string, input: Record<string, unknown>) => {
    const toolId = `tool-${++toolIdCounter}`
    set((state) => {
      if (!state.currentMessage) return state

      const blocks = [...(state.currentMessage.blocks || [])]
      blocks.push({ type: 'tool_use', id: toolId, name, input })

      return {
        currentMessage: { ...state.currentMessage, blocks },
        currentToolId: toolId,
      }
    })
  },

  setToolResult: (result: string, isError: boolean) => {
    set((state) => {
      if (!state.currentMessage?.blocks?.length || !state.currentToolId) return state

      const blocks = state.currentMessage.blocks.map((block) => {
        if (block.type === 'tool_use' && block.id === state.currentToolId) {
          return { ...block, result, isError }
        }
        return block
      })

      return { currentMessage: { ...state.currentMessage, blocks } }
    })
  },

  finalizeAssistantMessage: () => {
    const { currentMessage } = get()
    // Finalize if there are any blocks (thinking, tools, or text)
    if (currentMessage && currentMessage.blocks && currentMessage.blocks.length > 0) {
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
