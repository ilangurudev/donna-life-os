import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import clsx from 'clsx'

interface SplitPaneProps {
  left: ReactNode
  right: ReactNode
  /** Default width as percentage (0-100) */
  defaultLeftPercent?: number
  /** Minimum width as percentage (0-100) */
  minLeftPercent?: number
  /** Maximum width as percentage (0-100) */
  maxLeftPercent?: number
}

export function SplitPane({
  left,
  right,
  defaultLeftPercent = 60,
  minLeftPercent = 20,
  maxLeftPercent = 80,
}: SplitPaneProps) {
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent)
  const [isResizing, setIsResizing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  // Attach mouse event listeners when resizing
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const containerWidth = containerRect.width
      const mouseX = e.clientX - containerRect.left
      const newPercent = (mouseX / containerWidth) * 100

      if (newPercent >= minLeftPercent && newPercent <= maxLeftPercent) {
        setLeftPercent(newPercent)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, minLeftPercent, maxLeftPercent])

  return (
    <div
      ref={containerRef}
      className={clsx('flex h-full w-full', isResizing && 'select-none')}
    >
      {/* Left panel (Notes) */}
      <div
        className={clsx(
          'h-full flex-shrink-0 overflow-hidden transition-all duration-200',
          isCollapsed ? 'w-0' : ''
        )}
        style={{ width: isCollapsed ? 0 : `${leftPercent}%` }}
      >
        {left}
      </div>

      {/* Resize handle */}
      <div
        className={clsx(
          'group relative flex h-full w-1 flex-shrink-0 cursor-col-resize items-center justify-center',
          'bg-donna-border/50 hover:bg-donna-accent/50',
          isResizing && 'bg-donna-accent'
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Collapse/expand button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={clsx(
            'absolute z-10 flex h-6 w-6 items-center justify-center rounded-full',
            'bg-donna-surface text-donna-text-muted hover:bg-donna-surface-hover hover:text-donna-text',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            '-left-2.5'
          )}
          title={isCollapsed ? 'Expand notes panel' : 'Collapse notes panel'}
        >
          <svg
            className={clsx('h-3 w-3 transition-transform', isCollapsed && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Right panel (Chat) */}
      <div className="h-full flex-1 overflow-hidden">{right}</div>
    </div>
  )
}
