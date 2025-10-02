'use client'

import { CartItem } from '@/lib/types'

interface CartProps {
  items: CartItem[]
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
  total: number
  onCheckout: () => void
}

export default function Cart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  total,
  onCheckout,
}: CartProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Shopping Cart</h2>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Your cart is empty</p>
          <p className="text-sm text-gray-400 mt-2">Add items from the menu to get started!</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {items.map((item, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    {item.customizations && (
                      <div className="text-sm text-gray-500 mt-1">
                        {Object.entries(item.customizations).map(([key, value]) => (
                          <div key={key}>
                            {key}: {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold text-jollibee-red">
                    ₱{(item.price * item.quantity).toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold text-gray-800">Total:</span>
              <span className="text-2xl font-bold text-jollibee-red">
                ₱{total.toFixed(0)}
              </span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-4 bg-jollibee-red text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}



