import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../hooks'

export function UserMenu() {
  const { user, authEnabled, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // If auth is disabled, don't show the menu
  if (!authEnabled || !user) {
    return null
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-donna-surface transition-colors"
        title={user.email}
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name || user.email}
            className="w-8 h-8 rounded-full border border-donna-border"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-donna-accent flex items-center justify-center text-donna-bg font-medium text-sm">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-donna-bg-secondary rounded-lg shadow-lg border border-donna-border py-1 z-50 animate-fade-in">
          {/* User info */}
          <div className="px-4 py-3 border-b border-donna-border">
            <p className="text-sm font-medium text-donna-text truncate">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-donna-text-muted truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false)
                logout()
              }}
              className="w-full px-4 py-2 text-left text-sm text-donna-text hover:bg-donna-surface transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 text-donna-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
