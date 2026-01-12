import { useState } from 'react'
import { Wrench, ChevronDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'
import type { ToolCall } from '../../types'

interface ToolCallBlockProps {
  toolCall: ToolCall
}

export function ToolCallBlock({ toolCall }: ToolCallBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasResult = toolCall.result !== undefined

  return (
    <div
      className={clsx(
        'rounded-lg border overflow-hidden animate-fade-in',
        toolCall.isError
          ? 'border-donna-red/30 bg-donna-red/10'
          : 'border-donna-yellow/30 bg-donna-yellow/10'
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors',
          toolCall.isError
            ? 'hover:bg-donna-red/20'
            : 'hover:bg-donna-yellow/20'
        )}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-donna-yellow" />
        ) : (
          <ChevronRight className="h-4 w-4 text-donna-yellow" />
        )}
        <Wrench className="h-4 w-4 text-donna-yellow" />
        <span className="text-sm font-medium text-donna-yellow">
          {toolCall.name}
        </span>
        
        {/* Result indicator */}
        {hasResult && (
          <span className="ml-auto">
            {toolCall.isError ? (
              <XCircle className="h-4 w-4 text-donna-red" />
            ) : (
              <CheckCircle className="h-4 w-4 text-donna-green" />
            )}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Input */}
          <div>
            <span className="text-xs font-medium text-donna-text-muted">Input:</span>
            <pre className="mt-1 rounded bg-donna-bg-tertiary p-2 text-xs font-mono text-donna-text-secondary overflow-x-auto">
              {JSON.stringify(toolCall.input, null, 2)}
            </pre>
          </div>

          {/* Result */}
          {hasResult && (
            <div>
              <span className="text-xs font-medium text-donna-text-muted">
                {toolCall.isError ? 'Error:' : 'Result:'}
              </span>
              <pre
                className={clsx(
                  'mt-1 rounded p-2 text-xs font-mono overflow-x-auto max-h-40',
                  toolCall.isError
                    ? 'bg-donna-red/10 text-donna-red'
                    : 'bg-donna-bg-tertiary text-donna-text-secondary'
                )}
              >
                {formatResult(toolCall.result!)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatResult(result: string): string {
  // Truncate very long results
  const maxLength = 1000
  if (result.length > maxLength) {
    return result.slice(0, maxLength) + '\n... (truncated)'
  }
  return result
}
