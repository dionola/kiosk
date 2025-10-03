'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function OrderConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      // In a real app, you'd fetch the order details
      // For now, we'll just show a confirmation
      setOrder({ id: orderId })
      setLoading(false)
    } else {
      router.push('/')
    }
  }, [orderId, router])

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
    <div className="min-h-screen bg-gradient-to-br from-jollibee-red to-red-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Order Confirmed!</h1>
        <p className="text-xl text-gray-600 mb-6">
          Thank you for your order. Your order ID is:
        </p>
        <p className="text-2xl font-bold text-jollibee-red mb-8">{order?.id}</p>
        <p className="text-gray-600 mb-8">
          Your order is being prepared and will be ready soon!
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-8 py-4 bg-jollibee-red text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-colors"
        >
          Place Another Order
        </button>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-jollibee-red to-red-700 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}

