'use client'

import { useState, useRef, useEffect } from 'react'
import { CartItem, AIChatMessage } from '@/lib/types'

interface AIChatProps {
  cart: CartItem[]
  onCartUpdate: (cart: CartItem[]) => void
  onEditItemClick?: (item: CartItem) => void
  clearTrigger?: number
}

export default function AIChat({ cart, onCartUpdate, onEditItemClick, clearTrigger = 0 }: AIChatProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const saved = localStorage.getItem('jollibee_ai_chat_history')
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch (e) {
        // Fallback default message
        setMessages([{
          role: 'assistant',
          content: "Kumusta! Hi! I'm your AI ordering assistant. I can help you place orders, answer questions about the menu, or modify your cart. I understand English, Tagalog, and Taglish. What would you like today?",
        }])
      }
    } else {
      setMessages([{
        role: 'assistant',
        content: "Kumusta! Hi! I'm your AI ordering assistant. I can help you place orders, answer questions about the menu, or modify your cart. I understand English, Tagalog, and Taglish. What would you like today?",
      }])
    }
  }, [])

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('jollibee_ai_chat_history', JSON.stringify(messages))
    }
  }, [messages, isMounted])

  const WELCOME_MESSAGE: AIChatMessage = {
    role: 'assistant',
    content: "Kumusta! Hi! I'm your AI ordering assistant. I can help you place orders, answer questions about the menu, or modify your cart. I understand English, Tagalog, and Taglish. What would you like today?",
  }

  useEffect(() => {
    if (clearTrigger === 0) return
    setMessages([WELCOME_MESSAGE])
    localStorage.removeItem('jollibee_ai_chat_history')
  }, [clearTrigger])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input
    if (!textToSend.trim() || loading) return

    const userMessage: AIChatMessage = {
      role: 'user',
      content: textToSend,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: messages,
          cart,
        }),
      })

      const data = await response.json()

      const assistantMessage: AIChatMessage = {
        role: 'assistant',
        content: data.response || 'I apologize, I encountered an error.',
        addedItems: data.addedItems
      }

      setMessages(prev => [...prev, assistantMessage])

      if (data.cartUpdate) {
        onCartUpdate(data.cartUpdate)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, I encountered an error. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xl shadow-sm ${message.role === 'user' ? 'bg-gray-100' : 'bg-red-50 text-jollibee-red'
              }`}>
              {message.role === 'user' ? '👤' : '🐝'}
            </div>
            <div
              className={`max-w-[70%] px-6 py-4 rounded-3xl text-lg relative ${message.role === 'user'
                ? 'bg-jollibee-red text-white rounded-tr-none shadow-lg shadow-red-100'
                : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
                }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

              {message.addedItems && message.addedItems.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {message.addedItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => onEditItemClick && onEditItemClick(item)}
                      className="flex flex-col items-center bg-white rounded-[1rem] p-2.5 shadow-sm border border-gray-100 min-w-[90px] max-w-[120px] cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      {item.image ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-50 mb-2 shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover scale-110" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center text-3xl mb-2 shrink-0">
                          🍗
                        </div>
                      )}
                      <span className="text-[10px] font-black text-gray-800 text-center leading-tight w-full line-clamp-2 uppercase italic tracking-tight">{item.name}</span>

                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mt-1 mb-1 w-full">
                          {Object.values(item.customizations).map((custom, cIdx) => (
                            <span key={cIdx} className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase truncate max-w-full">
                              {custom.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <span className="text-[11px] text-jollibee-red font-black mt-1 px-2 py-0.5 bg-gray-50 rounded-full w-full text-center border border-gray-100">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={`absolute top-0 w-8 h-8 ${message.role === 'user'
                ? '-right-2 bg-jollibee-red clip-path-triangle-right'
                : '-left-2 bg-gray-50 border-l border-t border-gray-100 clip-path-triangle-left'
                }`} />
            </div>
          </div>
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

      {/* Input Area */}
      <div className="p-8 border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto flex gap-4 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyPress}
              placeholder="Tell me what you'd like to eat..."
              rows={1}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:outline-none focus:border-jollibee-red focus:bg-white transition-all text-lg resize-none custom-scrollbar pr-6 max-h-40"
              style={{ minHeight: '60px' }}
              disabled={loading}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="w-14 h-14 bg-jollibee-red text-white rounded-2xl flex items-center justify-center hover:bg-red-700 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-red-100 active:scale-90"
          >
            <span className="text-2xl font-bold">↑</span>
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-4 font-black">
          Powered by Jollibee AI • Multilingual Support
        </p>
      </div>

      <style jsx>{`
        .clip-path-triangle-right {
          clip-path: polygon(0 0, 0 100%, 100% 0);
        }
        .clip-path-triangle-left {
          clip-path: polygon(100% 0, 100% 100%, 0 0);
        }
      `}</style>
    </div>
  )
}

