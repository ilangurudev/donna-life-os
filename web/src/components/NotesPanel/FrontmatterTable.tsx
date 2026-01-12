import { Calendar, Tag, User, Flag, Zap, Clock } from 'lucide-react'
import clsx from 'clsx'

interface FrontmatterTableProps {
  frontmatter: Record<string, unknown>
}

const ICON_MAP: Record<string, typeof Calendar> = {
  type: Tag,
  status: Flag,
  created: Calendar,
  due_date: Clock,
  priority: Zap,
  relationship: User,
  energy_required: Zap,
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-donna-green/20 text-donna-green',
  todo: 'bg-donna-yellow/20 text-donna-yellow',
  done: 'bg-donna-text-muted/20 text-donna-text-muted',
  completed: 'bg-donna-text-muted/20 text-donna-text-muted',
  blocked: 'bg-donna-red/20 text-donna-red',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-donna-red/20 text-donna-red',
  medium: 'bg-donna-yellow/20 text-donna-yellow',
  low: 'bg-donna-green/20 text-donna-green',
}

export function FrontmatterTable({ frontmatter }: FrontmatterTableProps) {
  const entries = Object.entries(frontmatter).filter(
    ([key]) => !key.startsWith('_') // Skip internal fields
  )

  if (entries.length === 0) return null

  return (
    <div className="frontmatter-table text-xs sm:text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="frontmatter-row flex-col sm:flex-row gap-1 sm:gap-0">
          <div className="frontmatter-key flex items-center gap-2 w-full sm:w-32">
            {renderIcon(key)}
            <span>{formatKey(key)}</span>
          </div>
          <div className="frontmatter-value pl-5 sm:pl-0">
            {renderValue(key, value)}
          </div>
        </div>
      ))}
    </div>
  )
}

function renderIcon(key: string) {
  const Icon = ICON_MAP[key]
  if (Icon) {
    return <Icon className="h-3.5 w-3.5" />
  }
  return null
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function renderValue(key: string, value: unknown): React.ReactNode {
  // Handle arrays (like tags)
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-full bg-donna-surface px-2 py-0.5 text-xs"
          >
            {String(item)}
          </span>
        ))}
      </div>
    )
  }

  // Handle status with colors
  if (key === 'status' && typeof value === 'string') {
    const colorClass = STATUS_COLORS[value] || 'bg-donna-surface text-donna-text-secondary'
    return (
      <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', colorClass)}>
        {value}
      </span>
    )
  }

  // Handle priority with colors
  if (key === 'priority' && typeof value === 'string') {
    const colorClass = PRIORITY_COLORS[value] || 'bg-donna-surface text-donna-text-secondary'
    return (
      <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', colorClass)}>
        {value}
      </span>
    )
  }

  // Handle dates
  if (key.includes('date') || key === 'created' || key === 'discovered_on') {
    const dateStr = String(value)
    try {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return (
          <span className="text-donna-cyan">
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )
      }
    } catch {
      // Fall through to default
    }
  }

  // Default string rendering
  return <span>{String(value)}</span>
}
