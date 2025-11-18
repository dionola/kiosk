'use client'

import { AIChatMessage, CartItem } from '@/lib/types'
import LoadingImage from '@/components/ui/LoadingImage'

function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={index}>{part.slice(2, -2)}</span>
    }

    return part
  })
}

function ChatMessageContent({ content }: { content: string }) {
  const lines = content.split('\n')

  return (
    <div className="space-y-2 leading-relaxed">
      {lines.map((line, index) => {
        const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)$/)
        const bulletMatch = line.match(/^[-•]\s+(.+)$/)

        if (numberedMatch) {
          return (
            <div key={index} className="flex gap-2">
              <span className="min-w-6">{numberedMatch[1]}.</span>
              <span>{renderInlineMarkdown(numberedMatch[2])}</span>
            </div>
          )
        }

        if (bulletMatch) {
          return (
            <div key={index} className="flex gap-2">
              <span>•</span>
              <span>{renderInlineMarkdown(bulletMatch[1])}</span>
            </div>
          )
        }

        if (!line.trim()) {
          return <div key={index} className="h-1" />
        }

        return <p key={index}>{renderInlineMarkdown(line)}</p>
      })}
    </div>
  )
}

function AddedItemCard({
  item,
  onEditItemClick,
}: {
  item: CartItem
  onEditItemClick?: (item: CartItem) => void
}) {
  return (
    <div
      onClick={() => onEditItemClick?.(item)}
      className="flex flex-col items-center bg-white rounded-[1rem] p-2.5 shadow-sm border border-gray-100 min-w-[90px] max-w-[120px] cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      {item.image ? (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-50 mb-2 shrink-0">
          <LoadingImage
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover scale-110"
            fallback={<span className="text-3xl">🍗</span>}
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center text-3xl mb-2 shrink-0">
          🍗
        </div>
      )}

      <span className="text-[10px] font-black text-gray-800 text-center leading-tight w-full line-clamp-2 uppercase italic tracking-tight">
        {item.name}
      </span>

      {item.customizations && Object.keys(item.customizations).length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-1 mb-1 w-full">
          {Object.values(item.customizations).map((custom, index) => (
            <span
              key={index}
              className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase truncate max-w-full"
            >
              {custom.name}
            </span>
          ))}
        </div>
      )}

      <span className="text-[11px] text-jollibee-red font-black mt-1 px-2 py-0.5 bg-gray-50 rounded-full w-full text-center border border-gray-100">
        Qty: {item.quantity}
      </span>
    </div>
  )
}

export function ChatBubble({
  message,
  onEditItemClick,
}: {
  message: AIChatMessage
  onEditItemClick?: (item: CartItem) => void
}) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xl shadow-sm ${
          isUser ? 'bg-gray-100' : 'bg-red-50 text-jollibee-red'
        }`}
      >
        {isUser ? '👤' : '🐝'}
      </div>
      <div
        className={`max-w-[70%] px-6 py-4 rounded-3xl text-lg relative ${
          isUser
            ? 'bg-jollibee-red text-white rounded-tr-none shadow-lg shadow-red-100'
            : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
        }`}
      >
        <ChatMessageContent content={message.content} />

        {message.addedItems && message.addedItems.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {message.addedItems.map((item, index) => (
              <AddedItemCard
                key={`${item.menuItemId}-${index}`}
                item={item}
                onEditItemClick={onEditItemClick}
              />
            ))}
          </div>
        )}

        <div
          className={`absolute top-0 w-8 h-8 ${
            isUser
              ? '-right-2 bg-jollibee-red clip-path-triangle-right'
              : '-left-2 bg-gray-50 border-l border-t border-gray-100 clip-path-triangle-left'
          }`}
        />
      </div>
    </div>
  )
}
