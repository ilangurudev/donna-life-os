import { useState } from 'react'
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react'
import clsx from 'clsx'
import type { FileNode } from '../../types'

interface FileTreeProps {
  node: FileNode
  selectedPath: string | null
  onSelect: (path: string) => void
  level: number
}

export function FileTree({ node, selectedPath, onSelect, level }: FileTreeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels

  if (node.type === 'file') {
    const isSelected = selectedPath === node.path
    const statusColor = getStatusColor(node.metadata?.status as string)

    return (
      <button
        onClick={() => onSelect(node.path)}
        className={clsx(
          'flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors',
          'hover:bg-donna-surface-hover',
          isSelected ? 'bg-donna-surface text-donna-text' : 'text-donna-text-secondary'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <FileText className={clsx('h-4 w-4 flex-shrink-0', statusColor)} />
        <span className="truncate">{formatFileName(node.name)}</span>
        {node.metadata?.priority === 'high' && (
          <span className="ml-auto text-xs text-donna-red">!</span>
        )}
      </button>
    )
  }

  // Directory
  const hasChildren = node.children && node.children.length > 0
  
  // Skip rendering the root "donna-data" node, just render children
  if (level === 0 && node.name === 'donna-data') {
    return (
      <div className="py-1">
        {node.children?.map((child) => (
          <FileTree
            key={child.path}
            node={child}
            selectedPath={selectedPath}
            onSelect={onSelect}
            level={level}
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          'flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors',
          'hover:bg-donna-surface-hover text-donna-text-secondary'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-donna-text-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-donna-text-muted" />
          )
        ) : (
          <span className="w-4" />
        )}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 flex-shrink-0 text-donna-yellow" />
        ) : (
          <Folder className="h-4 w-4 flex-shrink-0 text-donna-yellow" />
        )}
        <span className="font-medium">{formatFolderName(node.name)}</span>
        {hasChildren && (
          <span className="ml-auto text-xs text-donna-text-muted">
            {node.children!.length}
          </span>
        )}
      </button>

      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FileTree
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function formatFileName(name: string): string {
  // Convert kebab-case to Title Case
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatFolderName(name: string): string {
  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function getStatusColor(status?: string): string {
  switch (status) {
    case 'active':
      return 'text-donna-green'
    case 'todo':
      return 'text-donna-yellow'
    case 'done':
    case 'completed':
      return 'text-donna-text-muted'
    case 'blocked':
      return 'text-donna-red'
    default:
      return 'text-donna-accent'
  }
}
