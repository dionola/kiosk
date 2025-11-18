import { ChatBubble } from '@/components/kiosk/ChatBubble'
import type { AIChatMessage, CartItem } from '@/lib/types'

interface ChatMessagesProps {
  messages: AIChatMessage[]
  loading: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onEditItemClick?: (item: CartItem) => void
}

export function ChatMessages({ messages, loading, messagesEndRef, onEditItemClick }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
      {messages.map((message, index) => (
        <ChatBubble key={index} message={message} onEditItemClick={onEditItemClick} />
      ))}
      {loading && (
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 text-jollibee-red flex items-center justify-center text-xl">
            🐝
          </div>
          <div className="bg-gray-50 rounded-3xl rounded-tl-none px-6 py-4 border border-gray-100">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-jollibee-red/40 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-jollibee-red/40 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-jollibee-red/40 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
