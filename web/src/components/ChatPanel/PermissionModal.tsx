import { AlertTriangle, Terminal, X } from 'lucide-react'
import type { PermissionRequest } from '../../types'

interface PermissionModalProps {
  request: PermissionRequest
  onAllow: () => void
  onDeny: () => void
}

export function PermissionModal({ request, onAllow, onDeny }: PermissionModalProps) {
  const command = request.input.command as string | undefined

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="w-full max-w-lg mx-4 rounded-xl bg-donna-bg-secondary border border-donna-border shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-donna-border px-4 py-3">
          <div className="flex items-center gap-2 text-donna-yellow">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Permission Required</h3>
          </div>
          <button
            onClick={onDeny}
            className="text-donna-text-muted hover:text-donna-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-donna-text">
            Donna wants to execute a <strong>{request.tool}</strong> command:
          </p>

          {command && (
            <div className="rounded-lg bg-donna-bg-tertiary p-3 border border-donna-border">
              <div className="flex items-center gap-2 mb-2 text-donna-text-muted">
                <Terminal className="h-4 w-4" />
                <span className="text-xs font-medium">Command</span>
              </div>
              <pre className="text-sm font-mono text-donna-text whitespace-pre-wrap break-all">
                {command}
              </pre>
            </div>
          )}

          {!command && (
            <pre className="rounded-lg bg-donna-bg-tertiary p-3 text-sm font-mono text-donna-text overflow-x-auto">
              {JSON.stringify(request.input, null, 2)}
            </pre>
          )}

          <p className="text-sm text-donna-text-muted">
            Review the command above and decide whether to allow it to run.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-donna-border p-4">
          <button
            onClick={onDeny}
            className="flex-1 rounded-lg border border-donna-border px-4 py-2.5 text-sm font-medium text-donna-text hover:bg-donna-surface transition-colors"
          >
            Deny
          </button>
          <button
            onClick={onAllow}
            className="flex-1 rounded-lg bg-donna-accent px-4 py-2.5 text-sm font-medium text-donna-bg hover:bg-donna-accent-hover transition-colors"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  )
}
