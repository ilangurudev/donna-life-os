import { useRef, useEffect } from 'react'
import { MessageCircle, Wifi, WifiOff } from 'lucide-react'
import { ChatHistory } from './ChatHistory'
import { ChatInput } from './ChatInput'
import { PermissionModal } from './PermissionModal'
import { DevModeToggle } from '../Layout/DevModeToggle'
import { useChatWebSocket } from '../../hooks/useChatWebSocket'
import { useChatStore } from '../../stores/useChatStore'

export function ChatPanel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { sendMessage, respondToPermission } = useChatWebSocket()
  const { messages, currentMessage, isConnected, isLoading, permissionRequest, sessionStats } = useChatStore()

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentMessage])

  return (
    <div className="flex h-full flex-col bg-donna-bg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-donna-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-donna-cyan" />
            <h2 className="font-semibold text-donna-text">Donna</h2>
          </div>
          
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-donna-green" />
                <span className="text-xs text-donna-green">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-donna-red" />
                <span className="text-xs text-donna-red">Disconnected</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Session stats */}
          {sessionStats && (
            <div className="flex items-center gap-3 text-xs text-donna-text-muted">
              {sessionStats.turns !== undefined && (
                <span>Turns: {sessionStats.turns}</span>
              )}
              {sessionStats.cost_usd !== undefined && (
                <span>${sessionStats.cost_usd.toFixed(4)}</span>
              )}
            </div>
          )}
          
          <DevModeToggle />
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        <ChatHistory
          messages={messages}
          currentMessage={currentMessage}
          isLoading={isLoading}
        />
      </div>

      {/* Input */}
      <div className="border-t border-donna-border p-4">
        <ChatInput
          onSend={sendMessage}
          disabled={!isConnected || isLoading}
        />
      </div>

      {/* Permission Modal */}
      {permissionRequest && (
        <PermissionModal
          request={permissionRequest}
          onAllow={() => respondToPermission(true)}
          onDeny={() => respondToPermission(false)}
        />
      )}
    </div>
  )
}
