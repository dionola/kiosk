'use client'

import { CartItem } from '@/lib/types'
import LoadingImage from '@/components/ui/LoadingImage'

interface CartProps {
  items: CartItem[]
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemoveItem: (index: number) => void
  onClearCart: () => void
  total: number
  onCheckout: () => void
  onEditItem: (index: number) => void
}

export default function Cart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  total,
  onCheckout,
  onEditItem,
}: CartProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center text-6xl mb-6 grayscale opacity-50">
          🛒
        </div>
        <h3 className="text-3xl font-black text-gray-900 mb-2">Your cart is empty</h3>
        <p className="text-xl text-gray-500 max-w-sm">
          Add some delicious Jollibee favorites to your order to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col h-full lg:flex-row gap-8 lg:gap-12">
      {/* Items List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-end mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black text-red-700 italic uppercase">Your Order</h3>
            <span className="px-3 py-1 bg-jollibee-yellow text-red-700 rounded-full text-sm font-black shadow-sm">
              {items.reduce((sum, i) => sum + i.quantity, 0)} Items
            </span>
          </div>
          <button
            onClick={onClearCart}
            className="text-xs font-black text-gray-400 hover:text-red-500 uppercase tracking-[0.2em] transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4">
          {items.map((item, index) => (
            <div
              key={`${item.menuItemId}-${index}`}
              onClick={() => onEditItem(index)}
              className="group flex gap-4 p-4 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-red-500/10 transition-all border-l-[12px] border-l-jollibee-red cursor-pointer"
            >
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100 rotate-[-2deg] group-hover:rotate-0 transition-transform">
                {item.image ? (
                  <LoadingImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover scale-110"
                    fallback={<span className="text-3xl">🍗</span>}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🍗</div>
                )}
              </div>

              <div className="flex-1 flex flex-col py-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg sm:text-xl font-black text-gray-900 leading-tight uppercase italic">{item.name}</h4>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveItem(index); }}
                    className="w-8 h-8 flex items-center justify-center text-xl text-gray-300 hover:text-jollibee-red hover:bg-red-50 rounded-full transition-all"
                  >
                    ×
                  </button>
                </div>

                {item.customizations && Object.keys(item.customizations).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(item.customizations).map(([group, custom]) => (
                      <span
                        key={group}
                        className="inline-flex items-center px-3 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-lg border border-red-100 uppercase italic"
                      >
                        {custom.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-end justify-between mt-auto">
                  <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl">
                    <button
                      onClick={(e) => { e.stopPropagation(); onUpdateQuantity(index, item.quantity - 1); }}
                      className="w-8 h-8 rounded-xl bg-white text-gray-600 hover:text-jollibee-red shadow-sm hover:shadow active:scale-90 transition-all flex items-center justify-center text-lg font-bold"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-lg font-black text-gray-900">{item.quantity}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onUpdateQuantity(index, item.quantity + 1); }}
                      className="w-8 h-8 rounded-xl bg-jollibee-red text-white shadow-md active:scale-90 transition-all flex items-center justify-center text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl sm:text-2xl font-black text-jollibee-red italic">
                      ₱{((item.price + (item.customizations ? Object.values(item.customizations).reduce((acc, curr) => acc + curr.price, 0) : 0)) * item.quantity).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Sidebar */}
      <div className="w-full lg:w-[360px] flex flex-col">
        <div className="bg-gradient-to-br from-red-600 to-jollibee-red rounded-[3rem] p-8 shadow-2xl shadow-red-200 text-white relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-jollibee-yellow/20 rounded-full blur-3xl" />

          <h3 className="text-2xl font-black mb-8 italic uppercase tracking-tighter">Summary</h3>

          <div className="space-y-4 mb-10">
            <div className="flex justify-between text-lg font-bold text-white/80">
              <span>Items Total</span>
              <span>₱{total.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white/80">
              <span>Service Fee</span>
              <span>FREE</span>
            </div>
            <div className="h-px bg-white/20 my-6" />
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black uppercase italic">To Pay</span>
              <div className="text-right">
                <span className="text-5xl font-black text-jollibee-yellow tracking-tighter block drop-shadow-md">₱{total.toFixed(0)}</span>
                <span className="text-[10px] font-black text-white/60 uppercase">Vat Included</span>
              </div>
            </div>
          </div>

          <button
            onClick={onCheckout}
            className="group relative w-full py-6 bg-jollibee-yellow text-red-700 rounded-3xl font-black text-2xl shadow-xl hover:bg-white hover:scale-[1.03] active:scale-[0.98] transition-all overflow-hidden uppercase italic tracking-tighter"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              Proceed to Pay
              <span className="text-3xl group-hover:translate-x-2 transition-transform">→</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>

          <div className="mt-8 flex flex-col items-center gap-2 opacity-60">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 h-1 bg-white rounded-full" />)}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-center">
              Made with ❤️ by Jollibee AI
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
