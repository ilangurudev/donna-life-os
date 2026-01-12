import { User, Bot, Loader2 } from 'lucide-react'
import { ThinkingBlock } from './ThinkingBlock'
import { ToolCallBlock } from './ToolCallBlock'
import { useDevMode } from '../../stores/useDevMode'
import type { ChatMessage } from '../../types'
import clsx from 'clsx'

interface ChatHistoryProps {
  messages: ChatMessage[]
  currentMessage: Partial<ChatMessage> | null
  isLoading: boolean
}

export function ChatHistory({ messages, currentMessage, isLoading }: ChatHistoryProps) {
  const { devMode } = useDevMode()

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} devMode={devMode} />
      ))}

      {/* Current streaming message */}
      {currentMessage && (
        <MessageBubble
          message={currentMessage as ChatMessage}
          devMode={devMode}
          isStreaming
        />
      )}

      {/* Loading indicator when waiting but no current message */}
      {isLoading && !currentMessage && (
        <div className="flex items-center gap-2 text-donna-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Thinking...</span>
        </div>
      )}
    </div>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
  devMode: boolean
  isStreaming?: boolean
}

function MessageBubble({ message, devMode, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={clsx(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : ''
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-donna-accent' : 'bg-donna-purple'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-donna-bg" />
        ) : (
          <Bot className="h-4 w-4 text-donna-bg" />
        )}
      </div>

      {/* Content */}
      <div className={clsx('flex-1 space-y-2', isUser ? 'items-end' : '')}>
        {/* Dev mode: Thinking block */}
        {devMode && message.thinking && (
          <ThinkingBlock content={message.thinking} />
        )}

        {/* Dev mode: Tool calls */}
        {devMode && message.toolCalls?.map((tool, i) => (
          <ToolCallBlock key={i} toolCall={tool} />
        ))}

        {/* Main message content */}
        {message.content && (
          <div
            className={clsx(
              'rounded-2xl px-4 py-2.5 max-w-[85%]',
              isUser
                ? 'bg-donna-accent text-donna-bg ml-auto'
                : 'bg-donna-surface text-donna-text'
            )}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-donna-accent ml-0.5 animate-pulse-subtle" />
              )}
            </p>
          </div>
        )}

        {/* Streaming indicator for empty content */}
        {isStreaming && !message.content && !message.thinking && !message.toolCalls?.length && (
          <div className="flex items-center gap-2 text-donna-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
      </div>
    </div>
  )
}
