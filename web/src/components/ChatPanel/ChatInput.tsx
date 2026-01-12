import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import clsx from 'clsx'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSubmit = () => {
    const trimmed = message.trim()
    if (trimmed && !disabled) {
      onSend(trimmed)
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Talk to Donna..."
          disabled={disabled}
          rows={1}
          className={clsx(
            'w-full resize-none rounded-xl border bg-donna-surface px-4 py-3 pr-12',
            'text-donna-text placeholder:text-donna-text-muted',
            'border-donna-border focus:border-donna-accent focus:outline-none',
            'transition-colors duration-150',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        
        {/* Character count for long messages */}
        {message.length > 500 && (
          <span className="absolute bottom-2 right-14 text-xs text-donna-text-muted">
            {message.length}
          </span>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        className={clsx(
          'flex h-11 w-11 items-center justify-center rounded-xl',
          'bg-donna-accent text-donna-bg',
          'hover:bg-donna-accent-hover transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-donna-accent'
        )}
        title="Send message (Enter)"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  )
}
