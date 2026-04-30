'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useCart, CartItem } from '@/lib/cart-context'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Image from 'next/image'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { items, getTotal, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const total = getTotal()

  // Redirect if not logged in
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/shop/checkout')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (items.length === 0) {
    router.push('/shop/cart')
    return null
  }

  const handleCheckout = async () => {
    setLoading(true)
    setError('')

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError('Please login to complete your purchase')
        router.push('/login?redirect=/shop/checkout')
        return
      }

      // Create orders for each item in the cart
      const orderIds: string[] = []

      for (const item of items) {
        const orderResponse = await fetch('/api/shop/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            product_id: item.productId,
            quantity: item.quantity,
            customer_email: user.email,
            customer_name: user.full_name || 'Customer',
            notes: `Color: ${item.selectedColor || 'Not selected'}, Size: ${item.selectedSize || 'Not selected'}, Custom: ${item.customNotes || 'None'}`,
          }),
        })

        const orderData = await orderResponse.json()

        if (!orderResponse.ok) {
          throw new Error(orderData.error || 'Failed to create order')
        }

        orderIds.push(orderData.order.id)
      }

      // If only one order, use direct PayFast
      if (orderIds.length === 1) {
        const paymentResponse = await fetch('/api/shop/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ order_id: orderIds[0] }),
        })

        const paymentData = await paymentResponse.json()

        if (!paymentResponse.ok) {
          throw new Error(paymentData.error || 'Failed to initiate payment')
        }

        // Submit PayFast form
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = paymentData.paymentUrl

        Object.entries(paymentData.paymentData).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = value as string
          form.appendChild(input)
        })

        document.body.appendChild(form)
        form.submit()
      } else {
        // Multiple orders - create a combined payment (simplified: redirect to success for now)
        // In production, you'd need to handle multiple PayFast payments or a custom checkout flow
        alert('For multiple items, you will be redirected to complete each payment. This is a demo flow.')
        
        // Clear cart and redirect to success
        clearCart()
        router.push('/shop/payment/success')
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Failed to process checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {items.map((item) => {
                  const displayPrice = item.salePrice || item.price
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                          {(item.selectedColor || item.selectedSize) && (
                            <> · {[item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}</>
                          )}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">
                        R{(displayPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>R{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at payment</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>R{total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Customer Info */}
          <div>
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{user.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 mb-4">
                  You will be redirected to PayFast to complete your secure payment.
                </p>
                
                <Button
                  onClick={handleCheckout}
                  disabled={loading || items.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Pay R${total.toFixed(2)} with PayFast`
                  )}
                </Button>

                <button
                  onClick={() => router.push('/shop/cart')}
                  className="w-full mt-3 text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Back to Cart
                </button>
              </div>
            </Card>

            {/* Security Note */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure payment powered by PayFast
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}