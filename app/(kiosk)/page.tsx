'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import MenuDisplay from '@/components/kiosk/MenuDisplay'
import Cart from '@/components/kiosk/Cart'
import AIChat from '@/components/kiosk/AIChat'
import ItemCustomizer from '@/components/kiosk/ItemCustomizer'
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

      {/* Full-screen Cart Modal */}
      {showCart && (
        <div
          onClick={() => {
            setShowCart(false)
            setCheckoutStage('idle')
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300 p-4 sm:p-0"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full h-full md:w-[90%] md:h-[90%] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-jollibee-red rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-red-200 text-white">
                  🛒
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Your Order</h2>
              </div>
              <button
                onClick={() => {
                  setShowCart(false)
                  setCheckoutStage('idle')
                }}
                className="w-12 h-12 flex items-center justify-center text-3xl text-gray-400 hover:text-jollibee-red hover:bg-red-50 rounded-full transition-all"
              >
                ×
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              {checkoutStage === 'idle' && (
                <Cart
                  items={cart}
                  onUpdateQuantity={updateCartItem}
                  onRemoveItem={removeFromCart}
                  onClearCart={clearCart}
                  total={cartTotal}
                  onCheckout={handleCheckout}
                  onEditItem={(index) => handleEditCartItem(cart[index], index)}
                />
              )}

              {checkoutStage === 'selectingType' && (
                <div className="flex flex-col items-center justify-center h-full gap-8">
                  <h2 className="text-4xl font-black text-gray-900 text-center italic uppercase">Where would you like to eat?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
                    <button
                      onClick={() => handleSelectOrderType('dine-in')}
                      className="group flex flex-col items-center gap-6 p-10 bg-white border-4 border-gray-100 rounded-[3rem] hover:border-jollibee-red hover:bg-red-50 transition-all shadow-xl hover:shadow-2xl active:scale-95"
                    >
                      <span className="text-8xl group-hover:scale-110 transition-transform">🍽️</span>
                      <span className="text-3xl font-black text-red-700 uppercase italic tracking-wider">Dine In</span>
                    </button>
                    <button
                      onClick={() => handleSelectOrderType('take-out')}
                      className="group flex flex-col items-center gap-6 p-10 bg-white border-4 border-gray-100 rounded-[3rem] hover:border-jollibee-red hover:bg-red-50 transition-all shadow-xl hover:shadow-2xl active:scale-95"
                    >
                      <span className="text-8xl group-hover:scale-110 transition-transform">🥡</span>
                      <span className="text-3xl font-black text-red-700 uppercase italic tracking-wider">Take Out</span>
                    </button>
                  </div>
                </div>
              )}

              {checkoutStage === 'completed' && (
                <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                  <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center text-6xl mb-4 animate-bounce">
                    ✅
                  </div>
                  <h2 className="text-5xl font-black text-gray-900 uppercase italic">Order Received!</h2>
                  <p className="text-2xl text-gray-600 font-bold">Your order number is:</p>
                  <div className="bg-gradient-to-br from-jollibee-red to-red-600 text-white text-[10rem] sm:text-[12rem] font-black px-16 py-10 rounded-[3rem] shadow-2xl shadow-red-200 tracking-tighter leading-none my-4 rotate-2">
                    {orderNumber}
                  </div>
                  <p className="text-2xl text-red-600 font-black mt-4 italic uppercase tracking-widest">
                    Please pay at the counter.
                  </p>
                  <button
                    onClick={handleFinish}
                    className="mt-8 px-16 py-6 bg-jollibee-yellow text-red-700 font-black text-3xl rounded-full shadow-xl hover:bg-white hover:scale-105 active:scale-95 transition-all uppercase italic tracking-tighter border-4 border-transparent hover:border-jollibee-yellow"
                  >
                    Close & Finish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-out AI Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] z-50 bg-white shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${showAI ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white/90 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-jollibee-yellow rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-yellow-100">
              🤖
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-none italic uppercase tracking-tight">Jollibee AI</h2>
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Ready to Order
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowAI(false)}
            className="w-12 h-12 flex items-center justify-center text-4xl text-gray-400 hover:text-jollibee-red hover:bg-red-50 rounded-full transition-all bg-gray-50"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-hidden relative">
          {showAI && (
            <AIChat
              cart={cart}
              onCartUpdate={(updatedCart) => {
                setCart(updatedCart)
                saveCart(updatedCart)
              }}
              onEditItemClick={handleEditCartItem}
              clearTrigger={chatClearTrigger}
            />
          )}
        </div>
      </div>

      {/* Backdrop for AI Drawer */}
      <div
        onClick={() => setShowAI(false)}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-500 ${showAI ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      />

      {/* Shared Item Customizer for Editing */}
      {editingMenuItem && (
        <ItemCustomizer
          item={editingMenuItem}
          initialCartItem={initialEditingCartItem || undefined}
          onAddToCart={handleSaveCustomizedItem}
          onClose={closeCustomizer}
        />
      )}

      {/* Toast Notification */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-gray-900 border border-gray-800 text-white rounded-full font-bold shadow-2xl transition-all duration-300 flex items-center gap-3 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
          }`}
      >
        <span className="text-jollibee-yellow text-2xl">🐝</span>
        <span>{toastMessage}</span>
      </div>
    </div>
  )
}

