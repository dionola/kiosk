'use client'

import AIChat from '@/components/kiosk/AIChat'
import Cart from '@/components/kiosk/Cart'
import ItemCustomizer from '@/components/kiosk/ItemCustomizer'
import { CartItem, MenuItem } from '@/lib/types'

export function CartOverlay({
  showCart,
  cart,
  cartTotal,
  checkoutStage,
  orderNumber,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onEditItem,
  onSelectOrderType,
  onFinish,
}: {
  showCart: boolean
  cart: CartItem[]
  cartTotal: number
  checkoutStage: 'idle' | 'selectingType' | 'completed'
  orderNumber: string | null
  onClose: () => void
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
  onCheckout: () => void
  onEditItem: (index: number) => void
  onSelectOrderType: (type: 'dine-in' | 'take-out') => void
  onFinish: () => void
}) {
  if (!showCart) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300 p-4 sm:p-0"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="bg-white w-full h-full md:w-[90%] md:h-[90%] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-jollibee-red rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-red-200 text-white">
              🛒
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Your Order</h2>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center text-3xl text-gray-400 hover:text-jollibee-red hover:bg-red-50 rounded-full transition-all"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {checkoutStage === 'idle' && (
            <Cart
              items={cart}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              onClearCart={onClearCart}
              total={cartTotal}
              onCheckout={onCheckout}
              onEditItem={onEditItem}
            />
          )}

          {checkoutStage === 'selectingType' && (
            <div className="flex flex-col items-center justify-center h-full gap-8">
              <h2 className="text-4xl font-black text-gray-900 text-center italic uppercase">
                Where would you like to eat?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
                <button
                  onClick={() => onSelectOrderType('dine-in')}
                  className="group flex flex-col items-center gap-6 p-10 bg-white border-4 border-gray-100 rounded-[3rem] hover:border-jollibee-red hover:bg-red-50 transition-all shadow-xl hover:shadow-2xl active:scale-95"
                >
                  <span className="text-8xl group-hover:scale-110 transition-transform">🍽️</span>
                  <span className="text-3xl font-black text-red-700 uppercase italic tracking-wider">Dine In</span>
                </button>
                <button
                  onClick={() => onSelectOrderType('take-out')}
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
                onClick={onFinish}
                className="mt-8 px-16 py-6 bg-jollibee-yellow text-red-700 font-black text-3xl rounded-full shadow-xl hover:bg-white hover:scale-105 active:scale-95 transition-all uppercase italic tracking-tighter border-4 border-transparent hover:border-jollibee-yellow"
              >
                Close & Finish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AIDrawer({
  showAI,
  cart,
  clearTrigger,
  onClose,
  onCartUpdate,
  onEditItemClick,
}: {
  showAI: boolean
  cart: CartItem[]
  clearTrigger: number
  onClose: () => void
  onCartUpdate: (cart: CartItem[]) => void
  onEditItemClick: (item: CartItem) => void
}) {
  return (
    <>
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] z-50 bg-white shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${
          showAI ? 'translate-x-0' : 'translate-x-full'
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
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center text-4xl text-gray-400 hover:text-jollibee-red hover:bg-red-50 rounded-full transition-all bg-gray-50"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-hidden relative">
          {showAI && (
            <AIChat
              cart={cart}
              onCartUpdate={onCartUpdate}
              onEditItemClick={onEditItemClick}
              clearTrigger={clearTrigger}
            />
          )}
        </div>
      </div>

      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-500 ${
          showAI ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
    </>
  )
}

export function ItemCustomizerOverlay({
  editingMenuItem,
  initialEditingCartItem,
  onAddToCart,
  onClose,
}: {
  editingMenuItem: MenuItem | null
  initialEditingCartItem: CartItem | null
  onAddToCart: (item: CartItem) => void
  onClose: () => void
}) {
  if (!editingMenuItem) return null

  return (
    <ItemCustomizer
      item={editingMenuItem}
      initialCartItem={initialEditingCartItem || undefined}
      onAddToCart={onAddToCart}
      onClose={onClose}
    />
  )
}

export function KioskToast({
  showToast,
  message,
}: {
  showToast: boolean
  message: string | null
}) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-gray-900 border border-gray-800 text-white rounded-full font-bold shadow-2xl transition-all duration-300 flex items-center gap-3 ${
        showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
      }`}
    >
      <span className="text-jollibee-yellow text-2xl">🐝</span>
      <span>{message}</span>
    </div>
  )
}
