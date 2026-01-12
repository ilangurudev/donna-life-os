import { useState } from 'react'
import { Brain, ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface ThinkingBlockProps {
  content: string
}

export function ThinkingBlock({ content }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Truncate for collapsed view
  const preview = content.slice(0, 150)
  const isTruncated = content.length > 150

  return (
    <div className="rounded-lg border border-donna-purple/30 bg-donna-purple/10 overflow-hidden animate-fade-in">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-donna-purple/20 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-donna-purple" />
        ) : (
          <ChevronRight className="h-4 w-4 text-donna-purple" />
        )}
        <Brain className="h-4 w-4 text-donna-purple" />
        <span className="text-sm font-medium text-donna-purple">Thinking</span>
      </button>

      <div
        className={clsx(
          'px-3 pb-3 text-sm text-donna-text-secondary overflow-hidden transition-all',
          isExpanded ? 'max-h-[500px]' : 'max-h-20'
        )}
      >
        <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
          {isExpanded ? content : (
            <>
              {preview}
              {isTruncated && (
                <span className="text-donna-text-muted">...</span>
              )}
            </>
          )}
        </p>
      </div>
    </div>
  )
}
