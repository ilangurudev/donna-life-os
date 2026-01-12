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
      // Limit height to 120px on mobile, 200px on desktop
      const maxHeight = window.innerWidth < 640 ? 120 : 200
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    }
  }, [message])

  const handleSubmit = () => {
    const trimmed = message.trim()
    if (trimmed && !disabled) {
      onSend(trimmed)
      setMessage('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift) - only on desktop
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 640) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-end gap-2 sm:gap-3">
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
            'w-full resize-none rounded-xl border bg-donna-surface',
            'px-3 py-2.5 sm:px-4 sm:py-3',
            'text-base sm:text-sm', // Larger text on mobile to prevent zoom
            'text-donna-text placeholder:text-donna-text-muted',
            'border-donna-border focus:border-donna-accent focus:outline-none',
            'transition-colors duration-150',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ fontSize: '16px' }} // Prevent iOS zoom on focus
        />
        
        {/* Character count for long messages - hidden on mobile */}
        {message.length > 500 && (
          <span className="hidden sm:block absolute bottom-2 right-3 text-xs text-donna-text-muted">
            {message.length}
          </span>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        className={clsx(
          'flex items-center justify-center rounded-xl touch-target',
          'h-11 w-11 sm:h-11 sm:w-11',
          'bg-donna-accent text-donna-bg',
          'hover:bg-donna-accent-hover active:bg-donna-accent-hover transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-donna-accent'
        )}
        title="Send message"
        aria-label="Send message"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  )
}
