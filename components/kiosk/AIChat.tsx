'use client'

import { useState, useRef, useEffect } from 'react'
import { CartItem, AIChatMessage } from '@/lib/types'
import { ChatMessages } from '@/components/kiosk/ChatMessages'
import { VoiceOrderControls } from '@/components/kiosk/VoiceOrderControls'

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
      <ChatMessages
        messages={messages}
        loading={loading}
        messagesEndRef={messagesEndRef}
        onEditItemClick={onEditItemClick}
      />
      <VoiceOrderControls
        input={input}
        loading={loading}
        isRecording={isRecording}
        isTranscribing={isTranscribing}
        speechError={speechError}
        mediaRecorderSupported={mediaRecorderSupported}
        textareaRef={textareaRef}
        onInputChange={handleInput}
        onKeyDown={handleKeyPress}
        onMicToggle={handleMicToggle}
        onSend={() => handleSend()}
      />
    </div>
  )
}
