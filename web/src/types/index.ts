// File tree types
export interface FileNode {
  type: 'file' | 'directory'
  name: string
  path: string
  metadata?: Record<string, unknown>
  children?: FileNode[]
}

// Note types
export interface Note {
  path: string
  frontmatter: Record<string, unknown>
  content: string
  raw: string
  wiki_links: string[]
  resolved_links: Record<string, string>
}

// Recent note (flat list item)
export interface RecentNote {
  path: string
  name: string
  title: string
  folder: string | null
  preview: string
  modified_at: number
  created_at: number
  metadata: Record<string, unknown>
}

// Recent notes API response
export interface RecentNotesResponse {
  notes: RecentNote[]
  total: number
  has_more: boolean
}

// Mobile navigation view types
export type MobileView = 'chat' | 'notes' | 'note-detail'

// Chat message types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  thinking?: string
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  name: string
  input: Record<string, unknown>
  result?: string
  isError?: boolean
}

// WebSocket event types
export type ChatEvent =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_use'; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; content: string; isError: boolean }
  | { type: 'permission_request'; tool: string; input: Record<string, unknown> }
  | { type: 'session_end'; stats: SessionStats }
  | { type: 'greeting_start' }
  | { type: 'error'; message: string }

export interface SessionStats {
  turns?: number
  duration_ms?: number
  cost_usd?: number
}

export type FileEvent =
  | { type: 'connected'; watching: string }
  | { type: 'file_created'; path: string }
  | { type: 'file_changed'; path: string }
  | { type: 'file_deleted'; path: string }

// Permission request state
export interface PermissionRequest {
  tool: string
  input: Record<string, unknown>
}

// Authentication types
export interface User {
  email: string
  name: string
  picture: string
}

export interface AuthStatus {
  auth_enabled: boolean
  authenticated: boolean
  user: User | null
}

export interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  authEnabled: boolean
  user: User | null
  error: string | null
}
