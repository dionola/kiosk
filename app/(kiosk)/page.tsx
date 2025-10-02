'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import MenuDisplay from '@/components/kiosk/MenuDisplay'
import Cart from '@/components/kiosk/Cart'
import AIChat from '@/components/kiosk/AIChat'
import { CartItem } from '@/lib/types'

export default function KioskPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    // Generate or retrieve session ID
    let session = localStorage.getItem('kiosk_session_id')
    if (!session) {
      session = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('kiosk_session_id', session)
    }
    setSessionId(session)

    // Load cart from API
    loadCart(session)
  }, [])

  const loadCart = async (session: string) => {
    try {
      const response = await fetch(`/api/cart?sessionId=${session}`)
      if (response.ok) {
        const data = await response.json()
        if (data.items) {
          setCart(data.items)
        }
      }
    } catch (error) {
      console.error('Failed to load cart:', error)
    }
  }

  const saveCart = async (items: CartItem[]) => {
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, items }),
      })
    } catch (error) {
      console.error('Failed to save cart:', error)
    }
  }

  const addToCart = (item: CartItem) => {
    const updatedCart = [...cart, item]
    setCart(updatedCart)
    saveCart(updatedCart)
  }

  const updateCartItem = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index)
      return
    }
    const updatedCart = [...cart]
    updatedCart[index].quantity = quantity
    setCart(updatedCart)
    saveCart(updatedCart)
  }

  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_item: CartItem, i: number) => i !== index)
    setCart(updatedCart)
    saveCart(updatedCart)
  }

  const clearCart = () => {
    setCart([])
    saveCart([])
  }

  const cartTotal = cart.reduce(
    (sum: number, item: CartItem) => sum + item.price * item.quantity,
    0
  )

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-jollibee-red to-red-700 overflow-hidden">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 lg:p-6 h-screen">
        <div className="h-full bg-white/5 rounded-3xl shadow-xl backdrop-blur-sm border border-white/10 overflow-hidden">
          <MenuDisplay onAddToCart={addToCart} />
        </div>
      </main>

      {/* Floating Actions */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-40">
        {/* Cart button */}
        <button
          onClick={() => setShowCart(true)}
          className="relative flex items-center gap-3 px-4 py-3 rounded-full bg-white text-jollibee-red shadow-xl hover:shadow-2xl hover:bg-gray-100 transition-all"
        >
          <span className="text-2xl">🛒</span>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold uppercase tracking-wide">Cart</span>
            <span className="text-xs text-gray-600">
              {cart.length} item{cart.length !== 1 ? 's' : ''} • ₱{cartTotal.toFixed(0)}
            </span>
          </div>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-jollibee-red text-white text-xs font-bold shadow-md">
              {cart.length}
            </span>
          )}
        </button>

        {/* AI Assistant button */}
        <button
          onClick={() => setShowAI(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-full bg-jollibee-yellow text-jollibee-red shadow-xl hover:shadow-2xl hover:bg-yellow-400 transition-all"
        >
          <span className="text-2xl">🤖</span>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold uppercase tracking-wide">AI Assistant</span>
            <span className="text-xs text-red-800">Order in English, Tagalog, or Taglish</span>
          </div>
        </button>
      </div>

      {/* Slide-over Cart */}
      {showCart && (
        <div className="fixed inset-0 z-30 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Your Order</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4">
              <Cart
                items={cart}
                onUpdateQuantity={updateCartItem}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                total={cartTotal}
                onCheckout={() => {
                  window.location.href = '/checkout'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Slide-over AI Chat */}
      {showAI && (
        <div className="fixed inset-0 z-30 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">AI Ordering Assistant</h2>
              <button
                onClick={() => setShowAI(false)}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4">
              <AIChat
                cart={cart}
                onCartUpdate={(updatedCart) => {
                  setCart(updatedCart)
                  saveCart(updatedCart)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



