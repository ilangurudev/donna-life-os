import { useEffect, useRef } from 'react'

interface NoteEditorProps {
  content: string
  onChange: (content: string) => void
}

export function NoteEditor({ content, onChange }: NoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea to fit content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [content])

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  return (
    <div className="p-3 sm:p-4 animate-fade-in">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[300px] p-3 bg-donna-surface border border-donna-border rounded-lg font-mono text-sm text-donna-text placeholder-donna-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-donna-accent focus:border-transparent"
        placeholder="Write your note here..."
        spellCheck={false}
      />
    </div>
  )
}
