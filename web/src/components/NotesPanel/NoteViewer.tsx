import { useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { FrontmatterTable } from './FrontmatterTable'
import type { Note } from '../../types'
import type { Components } from 'react-markdown'

interface NoteViewerProps {
  note: Note
  onNavigate: (path: string) => void
}

export function NoteViewer({ note, onNavigate }: NoteViewerProps) {
  // Convert wiki links to custom HTML elements before markdown processing
  const processedContent = processWikiLinks(note.content, note.resolved_links)

  const handleWikiClick = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    const path = e.currentTarget.dataset.path
    if (path) {
      e.preventDefault()
      e.stopPropagation()
      onNavigate(path)
    }
  }, [onNavigate])

  // Create components with the click handler
  const components: Components = {
    // Handle our custom wiki-link elements
    span: ({ className, children, ...props }) => {
      if (className === 'wiki-link-resolved') {
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
      if (className === 'wiki-link-unresolved') {
        return (
          <span className="wiki-link opacity-50 cursor-not-allowed" title="Note not found">
            {children}
          </span>
        )
      }
      return <span className={className} {...props}>{children}</span>
    },
    // Custom code block rendering
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '')
      const isInline = !match

      if (isInline) {
        return (
          <code
            className="bg-donna-surface px-1.5 py-0.5 rounded text-sm font-mono text-donna-pink"
            {...props}
          >
            {children}
          </code>
        )
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
  }

  return (
    <div className="p-3 sm:p-4 animate-fade-in">
      {/* Frontmatter */}
      {Object.keys(note.frontmatter).length > 0 && (
        <FrontmatterTable frontmatter={note.frontmatter} />
      )}

      {/* Markdown content */}
      <div className="markdown-content text-sm sm:text-base">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={components}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  )
}

function processWikiLinks(
  content: string,
  resolvedLinks: Record<string, string>
): string {
  // Replace [[link]] with custom HTML span elements
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, linkText) => {
    const resolvedPath = resolvedLinks[linkText]
    if (resolvedPath) {
      // Use data attribute to store the path
      return `<span class="wiki-link-resolved" data-path="${resolvedPath}">${linkText}</span>`
    }
    return `<span class="wiki-link-unresolved">${linkText}</span>`
  })
}
