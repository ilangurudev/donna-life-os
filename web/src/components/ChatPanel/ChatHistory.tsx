import { useCallback } from 'react'
import { User, Bot, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { ThinkingBlock } from './ThinkingBlock'
import { ToolCallBlock } from './ToolCallBlock'
import { useDevMode } from '../../stores/useDevMode'
import { useNotesNav } from '../../stores/useNotesNav'
import type { ChatMessage, ContentBlock } from '../../types'
import type { Components } from 'react-markdown'
import clsx from 'clsx'

interface ChatHistoryProps {
  messages: ChatMessage[]
  currentMessage: Partial<ChatMessage> | null
  isLoading: boolean
}

export function ChatHistory({ messages, currentMessage, isLoading }: ChatHistoryProps) {
  const { devMode } = useDevMode()

  // Show welcome message if no messages
  if (messages.length === 0 && !currentMessage && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-donna-purple mb-4">
          <Bot className="h-8 w-8 text-donna-bg" />
        </div>
        <h2 className="text-lg font-semibold text-donna-text mb-2">
          Hey, I'm Donna
        </h2>
        <p className="text-sm text-donna-text-secondary max-w-sm">
          Your AI-powered life operating system. Tell me what's on your mind,
          and I'll help you stay organized.
        </p>
      </div>
    )
  }

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
  const blocks = message.blocks || []

  // Filter blocks based on devMode
  const visibleBlocks = devMode
    ? blocks
    : blocks.filter((block) => block.type === 'text')

  // Find the last text block index for streaming cursor
  const lastTextBlockIndex = visibleBlocks.reduce(
    (lastIdx, block, idx) => (block.type === 'text' ? idx : lastIdx),
    -1
  )

  // Check if message has any visible content
  const hasVisibleContent = visibleBlocks.length > 0

  return (
    <div
      className={clsx(
        'flex gap-2 sm:gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : ''
      )}
    >
      {/* Avatar - smaller on mobile */}
      <div
        className={clsx(
          'flex flex-shrink-0 items-center justify-center rounded-full',
          'h-7 w-7 sm:h-8 sm:w-8',
          isUser ? 'bg-donna-accent' : 'bg-donna-purple'
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-donna-bg" />
        ) : (
          <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-donna-bg" />
        )}
      </div>

      {/* Content - render blocks in temporal order */}
      <div className={clsx('flex-1 space-y-2 min-w-0', isUser ? 'items-end' : '')}>
        {visibleBlocks.map((block, index) => (
          <BlockRenderer
            key={index}
            block={block}
            isUser={isUser}
            showStreamingCursor={isStreaming && index === lastTextBlockIndex}
          />
        ))}

        {/* Streaming indicator for empty content */}
        {isStreaming && !hasVisibleContent && (
          <div className="flex items-center gap-2 text-donna-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface BlockRendererProps {
  block: ContentBlock
  isUser: boolean
  showStreamingCursor?: boolean
}

// Convert [[wikilinks]] to clickable spans (stores original link text for resolution at click time)
function processWikiLinks(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, linkText) => {
    // Store the original link text - resolution happens at click time
    return `<span class="wiki-link-chat" data-link="${linkText}">${linkText}</span>`
  })
}

function BlockRenderer({ block, isUser, showStreamingCursor }: BlockRendererProps) {
  const { navigateToNote, resolveWikiLink } = useNotesNav()

  const handleWikiClick = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    const linkText = e.currentTarget.dataset.link
    if (linkText) {
      e.preventDefault()
      e.stopPropagation()
      // Resolve the wikilink to a full path using the file tree lookup
      const resolvedPath = resolveWikiLink(linkText)
      if (resolvedPath) {
        navigateToNote(resolvedPath)
      } else {
        // Fallback to simple conversion if not found in lookup
        const fallbackPath = linkText.toLowerCase().replace(/\s+/g, '-') + '.md'
        navigateToNote(fallbackPath)
      }
    }
  }, [navigateToNote, resolveWikiLink])

  // Custom components for ReactMarkdown
  const components: Components = {
    // Handle wikilink spans
    span: ({ className, children, ...props }) => {
      if (className === 'wiki-link-chat') {
        return (
          <span
            className="wiki-link cursor-pointer"
            onClick={handleWikiClick}
            role="button"
            tabIndex={0}
            {...props}
          >
            {children}
          </span>
        )
      }
      return <span className={className} {...props}>{children}</span>
    },
    // Ensure paragraphs don't add extra margins in chat bubbles
    p: ({ children }) => <span className="block">{children}</span>,
  }

  switch (block.type) {
    case 'thinking':
      return <ThinkingBlock content={block.content} />

    case 'tool_use':
      return (
        <ToolCallBlock
          toolCall={{
            name: block.name,
            input: block.input,
            result: block.result,
            isError: block.isError,
          }}
        />
      )

    case 'text': {
      const processedContent = processWikiLinks(block.content || '')
      return (
        <div
          className={clsx(
            'rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5',
            'max-w-[90%] sm:max-w-[85%]',
            isUser
              ? 'bg-donna-accent text-donna-bg ml-auto'
              : 'bg-donna-surface text-donna-text'
          )}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed break-words chat-message-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={components}
            >
              {processedContent}
            </ReactMarkdown>
            {showStreamingCursor && (
              <span className="inline-block w-1.5 h-4 bg-donna-accent ml-0.5 animate-pulse-subtle" />
            )}
          </div>
        </div>
      )
    }

    default:
      return null
  }
}
