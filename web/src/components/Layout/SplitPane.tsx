import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import clsx from 'clsx'

interface SplitPaneProps {
  left: ReactNode
  right: ReactNode
  defaultLeftWidth?: number
  minLeftWidth?: number
  maxLeftWidth?: number
}

export function SplitPane({
  left,
  right,
  defaultLeftWidth = 350,
  minLeftWidth = 200,
  maxLeftWidth = 600,
}: SplitPaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
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
      const newWidth = e.clientX - containerRect.left

      if (newWidth >= minLeftWidth && newWidth <= maxLeftWidth) {
        setLeftWidth(newWidth)
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
  }, [isResizing, minLeftWidth, maxLeftWidth])

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full select-none"
    >
      {/* Left panel */}
      <div
        className={clsx(
          'h-full flex-shrink-0 overflow-hidden transition-all duration-200',
          isCollapsed ? 'w-0' : ''
        )}
        style={{ width: isCollapsed ? 0 : leftWidth }}
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

      {/* Right panel */}
      <div className="h-full flex-1 overflow-hidden">{right}</div>
    </div>
  )
}
