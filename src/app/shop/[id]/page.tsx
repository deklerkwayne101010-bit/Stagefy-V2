'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Image from 'next/image'

interface ShopProduct {
  id: string
  name: string
  description: string
  price: number
  sale_price: number | null
  category: string
  status: string
  image_url: string | null
  color?: string
  size?: string
  sku?: string
  stock_quantity?: number
  brand?: string
  weight?: string
}

export default function ProductPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch('/api/shop/products')
      const data = await response.json()
      
      if (data.products) {
        const found = data.products.find((p: ShopProduct) => p.id === params.id)
        setProduct(found || null)
      }
    } catch (error) {
      console.error('Failed to load product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!user) {
      alert('Please login to make a purchase')
      return
    }

    if (!product) return

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        alert('Please login to make a purchase')
        return
      }

      const response = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
          customer_email: user.email,
          customer_name: user.full_name || 'Customer',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to create order')
        return
      }

      const paymentResponse = await fetch('/api/shop/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ order_id: data.order.id }),
      })

      const paymentData = await paymentResponse.json()

      if (!paymentResponse.ok) {
        alert(paymentData.error || 'Failed to initiate payment')
        return
      }

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
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Failed to process purchase')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
            <p className="text-gray-600 mb-6">This product doesn't exist.</p>
            <Button onClick={() => router.push('/shop')}>
              Back to Shop
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const displayPrice = product.sale_price || product.price

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button 
          onClick={() => router.push('/shop')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Shop
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {product.image_url ? (
              <div className="relative aspect-square w-full">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-6xl">📦</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Category Badge */}
            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium capitalize">
              {product.category}
            </span>

            {/* Product Name */}
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-gray-900">R{displayPrice}</span>
              {product.sale_price && (
                <span className="text-xl text-gray-400 line-through">R{product.price}</span>
              )}
              {product.sale_price && (
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">
                  Save R{product.price - product.sale_price}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 text-lg">
              {product.description || 'No description available.'}
            </p>

            {/* Product Details */}
            <Card className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {product.color && (
                  <div>
                    <span className="text-gray-500">Color:</span>
                    <span className="ml-2 font-medium">{product.color}</span>
                  </div>
                )}
                {product.size && (
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <span className="ml-2 font-medium">{product.size}</span>
                  </div>
                )}
                {product.brand && (
                  <div>
                    <span className="text-gray-500">Brand:</span>
                    <span className="ml-2 font-medium">{product.brand}</span>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <span className="text-gray-500">Weight:</span>
                    <span className="ml-2 font-medium">{product.weight}</span>
                  </div>
                )}
                {product.sku && (
                  <div>
                    <span className="text-gray-500">SKU:</span>
                    <span className="ml-2 font-medium">{product.sku}</span>
                  </div>
                )}
                {product.stock_quantity !== undefined && (
                  <div>
                    <span className="text-gray-500">In Stock:</span>
                    <span className="ml-2 font-medium">{product.stock_quantity} units</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Quantity:</span>
              <div className="flex items-center border rounded-lg">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Buy Button */}
            <Button 
              onClick={handlePurchase}
              className="w-full py-4 text-lg"
              disabled={product.status !== 'active'}
            >
              {product.status === 'active' ? 'Buy Now' : 'Out of Stock'}
            </Button>

            {/* Status */}
            {product.status !== 'active' && (
              <p className="text-center text-red-600">
                This product is currently not available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}