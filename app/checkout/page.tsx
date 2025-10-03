'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CartItem } from '@/lib/types'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const loadCart = useCallback(async (session: string) => {
    try {
      const response = await fetch(`/api/cart?sessionId=${session}`)
      if (response.ok) {
        const data = await response.json()
        if (data.items && data.items.length > 0) {
          setCart(data.items)
        } else {
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Failed to load cart:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const session = localStorage.getItem('kiosk_session_id')
    if (!session) {
      router.push('/')
      return
    }
    setSessionId(session)
    loadCart(session)
  }, [loadCart, router])

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          sessionId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/order-confirmation?id=${data.order.id}`)
      } else {
        alert('Failed to place order. Please try again.')
      }
    } catch (error) {
      console.error('Failed to place order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-jollibee-red to-red-700 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-jollibee-red to-red-700 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between border-b pb-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity}x ₱{item.price.toFixed(0)}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ₱{(item.price * item.quantity).toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t-2 pt-4">
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                  <span className="text-jollibee-red">₱{total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Customer Information</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jollibee-red"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jollibee-red"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-jollibee-red"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-4 bg-jollibee-red text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


