'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import MenuDisplay from '@/components/kiosk/MenuDisplay'
import {
  AIDrawer,
  CartOverlay,
  ItemCustomizerOverlay,
  KioskToast,
} from '@/components/kiosk/KioskOverlays'
import { CartItem, MenuItem } from '@/lib/types'

export default function KioskPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [checkoutStage, setCheckoutStage] = useState<'idle' | 'selectingType' | 'completed'>('idle')
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')

  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number | null>(null)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [initialEditingCartItem, setInitialEditingCartItem] = useState<CartItem | null>(null)

  const [chatClearTrigger, setChatClearTrigger] = useState(0)

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastTimeoutId, setToastTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null)

  const triggerToast = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    const timeoutId = setTimeout(() => setShowToast(false), 3000)
    setToastTimeoutId(timeoutId)
  }

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
    triggerToast(`Added ${item.name} to order`)
  }

  const handleEditCartItem = async (cartItem: CartItem, index?: number) => {
    let targetIndex = index
    if (targetIndex === undefined) {
      targetIndex = cart.findIndex(c =>
        c.menuItemId === cartItem.menuItemId &&
        JSON.stringify(c.customizations) === JSON.stringify(cartItem.customizations)
      )
    }

    try {
      const res = await fetch('/api/menu')
      if (res.ok) {
        const menuItems: MenuItem[] = await res.json()
        const fullMenuItem = menuItems.find((m: MenuItem) => m.id === cartItem.menuItemId)
        if (fullMenuItem) {
          setEditingMenuItem(fullMenuItem)
          setInitialEditingCartItem(cartItem)
          setEditingCartItemIndex(targetIndex !== -1 && targetIndex !== undefined ? targetIndex : null)
        }
      }
    } catch (e) {
      console.error("Failed to load menu item for editing", e)
    }
  }

  const handleSaveCustomizedItem = (item: CartItem) => {
    if (editingCartItemIndex !== null) {
      const updatedCart = [...cart]
      updatedCart[editingCartItemIndex] = item
      setCart(updatedCart)
      saveCart(updatedCart)
      triggerToast(`Updated ${item.name}`)
    } else {
      addToCart(item)
    }
    closeCustomizer()
  }

  const closeCustomizer = () => {
    setEditingMenuItem(null)
    setInitialEditingCartItem(null)
    setEditingCartItemIndex(null)
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
    const itemName = cart[index]?.name || 'Item'
    const updatedCart = cart.filter((_item: CartItem, i: number) => i !== index)
    setCart(updatedCart)
    saveCart(updatedCart)
    triggerToast(`Removed ${itemName}`)
  }

  const clearCart = () => {
    setCart([])
    saveCart([])
    setChatClearTrigger(t => t + 1)
    triggerToast('Cart cleared')
  }

  const handleCheckout = () => {
    setCheckoutStage('selectingType')
  }

  const handleSelectOrderType = (type: 'dine-in' | 'take-out') => {
    const num = Math.floor(100 + Math.random() * 900).toString()
    setOrderNumber(num)
    setCheckoutStage('completed')
    clearCart()
  }

  const handleFinish = () => {
    setCheckoutStage('idle')
    setShowCart(false)
    setOrderNumber(null)
  }

  const cartTotal = cart.reduce(
    (sum: number, item: CartItem) => {
      let customizationTotal = 0
      if (item.customizations) {
        customizationTotal = Object.values(item.customizations).reduce((acc, curr) => acc + curr.price, 0)
      }
      return sum + (item.price + customizationTotal) * item.quantity
    },
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
      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 z-40">
        {/* Cart button */}
        <button
          onClick={() => setShowCart(true)}
          disabled={cart.length === 0}
          className={`relative flex items-center justify-center w-20 h-20 rounded-full shadow-2xl transition-all ${cart.length > 0
            ? 'bg-white text-jollibee-red hover:scale-110 hover:bg-gray-50 active:scale-95'
            : 'bg-white/50 text-gray-400 cursor-not-allowed opacity-50'
            }`}
        >
          <div className="relative">
            <span className="text-4xl text-jollibee-red">🛒</span>
            {cart.length > 0 && (
              <span className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-jollibee-yellow text-red-700 text-sm font-black shadow-md border-4 border-white animate-bounce">
                {cart.length}
              </span>
            )}
          </div>
        </button>

        {/* AI Assistant button */}
        <button
          onClick={() => setShowAI(true)}
          className="flex items-center justify-center w-20 h-20 rounded-full bg-jollibee-yellow text-jollibee-red shadow-2xl hover:scale-110 hover:bg-yellow-400 active:scale-95 transition-all"
        >
          <div className="w-14 h-14 flex items-center justify-center bg-white rounded-full text-3xl shadow-inner animate-pulse">
            🤖
          </div>
        </button>
      </div>

      <CartOverlay
        showCart={showCart}
        cart={cart}
        cartTotal={cartTotal}
        checkoutStage={checkoutStage}
        orderNumber={orderNumber}
        onClose={() => {
          setShowCart(false)
          setCheckoutStage('idle')
        }}
        onUpdateQuantity={updateCartItem}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
        onEditItem={(index) => handleEditCartItem(cart[index], index)}
        onSelectOrderType={handleSelectOrderType}
        onFinish={handleFinish}
      />

      <AIDrawer
        showAI={showAI}
        cart={cart}
        clearTrigger={chatClearTrigger}
        onClose={() => setShowAI(false)}
        onCartUpdate={(updatedCart) => {
          setCart(updatedCart)
          saveCart(updatedCart)
        }}
        onEditItemClick={handleEditCartItem}
      />

      <ItemCustomizerOverlay
        editingMenuItem={editingMenuItem}
        initialEditingCartItem={initialEditingCartItem}
        onAddToCart={handleSaveCustomizedItem}
        onClose={closeCustomizer}
      />

      <KioskToast showToast={showToast} message={toastMessage} />
    </div>
  )
}

