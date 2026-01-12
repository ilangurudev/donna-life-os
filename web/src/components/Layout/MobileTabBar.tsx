import { MessageCircle, FileText } from 'lucide-react'
import clsx from 'clsx'
import type { MobileView } from '../../types'

interface MobileTabBarProps {
  currentView: MobileView
  onViewChange: (view: MobileView) => void
  unreadCount?: number
}

export function MobileTabBar({ currentView, onViewChange, unreadCount }: MobileTabBarProps) {
  return (
    <nav className="mobile-tab-bar" role="tablist">
      <button
        role="tab"
        aria-selected={currentView === 'chat'}
        onClick={() => onViewChange('chat')}
        className={clsx('mobile-tab flex-1', currentView === 'chat' && 'active')}
      >
        <div className="relative">
          <MessageCircle className="h-6 w-6" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full 
                           bg-donna-red text-donna-bg text-xs font-medium 
                           flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-xs mt-1 font-medium">Chat</span>
      </button>

      <button
        role="tab"
        aria-selected={currentView === 'notes'}
        onClick={() => onViewChange('notes')}
        className={clsx('mobile-tab flex-1', currentView === 'notes' && 'active')}
      >
        <FileText className="h-6 w-6" />
        <span className="text-xs mt-1 font-medium">Notes</span>
      </button>
    </nav>
  )
}
