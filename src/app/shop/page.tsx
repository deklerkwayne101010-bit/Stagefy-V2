'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import Image from 'next/image'

interface ShopProduct {
  id: string
  name: string
  description: string
  price: number
  sale_price?: number | null
  category: string
  status: string
  image_url?: string | null
  thumbnail_url?: string | null
}

export default function ShopPage() {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      loadData()
    }
  }, [authLoading])

  const loadData = async () => {
    try {
      const response = await fetch('/api/shop/products')
      const data = await response.json()
      console.log('Products response:', data)
      console.log('Products array:', data.products)
      
if (data.products && Array.isArray(data.products)) {
        console.log('Setting products:', data.products.length)
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handlePurchase = async (product: ShopProduct) => {
    if (!user) {
      alert('Please login to make a purchase')
      return
    }

    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      alert('Please login to make a purchase')
      return
    }

    try {
      const response = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-gray-600 mb-6">Please login to access the shop.</p>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shop</h1>
          <p className="text-gray-600 mt-1">Quality products for you</p>
        </div>

        {isLoadingProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available at the moment.</p>
            <p className="text-gray-400 text-sm mt-2">Products loaded: {products.length}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                {product.image_url ? (
                  <div className="relative h-64 w-full rounded-t-xl overflow-hidden">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      {product.sale_price ? (
                        <div>
                          <span className="text-2xl font-bold text-red-600">R{product.sale_price}</span>
                          <span className="text-sm text-gray-400 line-through ml-2">R{product.price}</span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">R{product.price}</span>
                      )}
                    </div>
                    <Button onClick={() => handlePurchase(product)}>
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}