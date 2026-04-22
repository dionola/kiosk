'use client'

import { useState, useRef, useEffect } from 'react'
import { CartItem, AIChatMessage } from '@/lib/types'

const WELCOME_MESSAGE: AIChatMessage = {
  role: 'assistant',
  content: "Kumusta! Hi! I'm your AI ordering assistant. I can help you place orders, answer questions about the menu, or modify your cart. I understand English, Tagalog, and Taglish. What would you like today?",
}

interface AIChatProps {
  cart: CartItem[]
  onCartUpdate: (cart: CartItem[]) => void
  onEditItemClick?: (item: CartItem) => void
  clearTrigger?: number
}

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

export default function AIChat({ cart, onCartUpdate, onEditItemClick, clearTrigger = 0 }: AIChatProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [mediaRecorderSupported, setMediaRecorderSupported] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    setIsMounted(true)
    const saved = localStorage.getItem('jollibee_ai_chat_history')
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch (e) {
        setMessages([WELCOME_MESSAGE])
      }
    } else {
      setMessages([WELCOME_MESSAGE])
    }
  }, [])

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('jollibee_ai_chat_history', JSON.stringify(messages))
    }
  }, [messages, isMounted])

  useEffect(() => {
    if (clearTrigger === 0) return
    setMessages([WELCOME_MESSAGE])
    localStorage.removeItem('jollibee_ai_chat_history')
  }, [clearTrigger])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMediaRecorderSupported(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined')

    return () => {
      mediaRecorderRef.current?.stop()
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

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

  const transcribeAudio = async (audioBlob: Blob) => {
    if (audioBlob.size === 0) return

    setIsTranscribing(true)
    setSpeechError(null)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'voice-order.webm')

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transcribe audio')
      }

      const transcript = String(data.text || '').trim()
      if (!transcript) {
        setSpeechError("I couldn't hear an order. Please try again.")
        return
      }

      setInput(transcript)
      await handleSend(transcript)
    } catch (error) {
      console.error('Failed to transcribe audio:', error)
      setSpeechError('Voice input failed. Please try again or type your order.')
    } finally {
      setIsTranscribing(false)
    }
  }

  const startRecording = async () => {
    if (!mediaRecorderSupported || loading || isTranscribing) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      audioChunksRef.current = []
      mediaStreamRef.current = stream

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        stream.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        mediaRecorderRef.current = null
        void transcribeAudio(audioBlob)
      }

      recorder.start()
      setIsRecording(true)
      setSpeechError(null)
    } catch (error) {
      console.error('Failed to start recording:', error)
      setSpeechError('Microphone access was blocked. Please allow mic access and try again.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  const handleMicToggle = () => {
    if (isRecording) {
      stopRecording()
    } else {
      void startRecording()
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
              <ChatMessageContent content={message.content} />

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
              placeholder="Message"
              rows={1}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:outline-none focus:border-jollibee-red focus:bg-white transition-all text-lg text-gray-900 placeholder:text-gray-400 caret-jollibee-red resize-none no-scrollbar pr-6 max-h-40"
              style={{ minHeight: '60px' }}
              disabled={loading}
            />
          </div>
          {mediaRecorderSupported && (
            <button
              type="button"
              onClick={handleMicToggle}
              disabled={loading || isTranscribing}
              aria-label={isRecording ? 'Stop recording voice order' : 'Start recording voice order'}
              className={`w-[60px] h-[60px] rounded-[2rem] flex items-center justify-center transition-all shadow-xl active:scale-90 ${
                isRecording
                  ? 'bg-jollibee-yellow text-red-700 shadow-yellow-100'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${loading || isTranscribing ? 'opacity-30 grayscale' : ''}`}
            >
              <span className="text-2xl">{isRecording ? '◼' : '🎤'}</span>
            </button>
          )}
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="w-[60px] h-[60px] bg-jollibee-red text-white rounded-[2rem] flex items-center justify-center hover:bg-red-700 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-red-100 active:scale-90"
          >
            <span className="text-2xl font-bold">↑</span>
          </button>
        </div>
        <div className="min-h-[1.25rem] mt-3 px-1">
          {isRecording && (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-jollibee-red">
              Recording... tap stop when you are done
            </p>
          )}
          {!isRecording && isTranscribing && (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-jollibee-red">
              Transcribing your order...
            </p>
          )}
          {!isRecording && !isTranscribing && speechError && (
            <p className="text-xs font-bold text-red-500">{speechError}</p>
          )}
          {!isRecording && !isTranscribing && !speechError && mediaRecorderSupported && (
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
              Tap the mic, speak your order, then tap stop
            </p>
          )}
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