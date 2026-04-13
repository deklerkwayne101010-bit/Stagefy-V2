'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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
  credits_included?: number | null
  is_featured: boolean
  sort_order: number
}

interface Order {
  id: string
  product_id: string
  product?: ShopProduct
  quantity: number
  total_amount: number
  status: string
  created_at: string
}

const categories = [
  { value: 'credits', label: 'Credits', icon: '💰' },
  { value: 'subscription', label: 'Subscriptions', icon: '📅' },
  { value: 'template_pack', label: 'Template Packs', icon: '📄' },
  { value: 'service', label: 'Services', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📦' },
]

export default function ShopPage() {
  const { user, loading } = useAuth()
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null)
  const [showAddProduct, setShowAddProduct] = useState(false)

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    sale_price: 0,
    category: 'credits',
    status: 'active',
    image_url: '',
    thumbnail_url: '',
    credits_included: 0,
    is_featured: false,
    sort_order: 0,
  })

  useEffect(() => {
    if (!loading && user) {
      checkAdminAndLoadData()
    }
  }, [user, loading])

  const checkAdminAndLoadData = async () => {
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.access_token) {
      const response = await fetch('/api/shop/products?status=all', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const data = await response.json()
      if (data.products) {
        setProducts(data.products)
      }

      const ordersResponse = await fetch('/api/shop/orders', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const ordersData = await ordersResponse.json()
      if (ordersData.orders) {
        setOrders(ordersData.orders)
      }

      const profileRes = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const profileData = await profileRes.json()
      if (profileData.user?.role === 'admin') {
        setIsAdmin(true)
      }
    }
    setIsLoadingProducts(false)
  }

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

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

  const handleSaveProduct = async () => {
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) return

    const url = editingProduct ? '/api/shop/products' : '/api/shop/products'
    const method = editingProduct ? 'PUT' : 'POST'

    const payload = editingProduct 
      ? { id: editingProduct.id, ...newProduct }
      : newProduct

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      setShowAddProduct(false)
      setEditingProduct(null)
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        sale_price: 0,
        category: 'credits',
        status: 'active',
        image_url: '',
        thumbnail_url: '',
        credits_included: 0,
        is_featured: false,
        sort_order: 0,
      })
      checkAdminAndLoadData()
    } else {
      alert('Failed to save product')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) return

    const response = await fetch(`/api/shop/products?id=${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })

    if (response.ok) {
      checkAdminAndLoadData()
    } else {
      alert('Failed to delete product')
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) return

    const response = await fetch('/api/shop/orders', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id: orderId, status }),
    })

    if (response.ok) {
      checkAdminAndLoadData()
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shop</h1>
            <p className="text-gray-600 mt-1">Purchase credits, subscriptions, and more</p>
          </div>
          {isAdmin && (
            <Button 
              variant={showAdminPanel ? 'primary' : 'outline'}
              onClick={() => setShowAdminPanel(!showAdminPanel)}
            >
              {showAdminPanel ? 'Hide Admin Panel' : 'Admin Panel'}
            </Button>
          )}
        </div>

        {isAdmin && showAdminPanel && (
          <div className="mb-8">
            <Card>
              <CardHeader title="Admin - Manage Products" action={
                <Button onClick={() => { setShowAddProduct(true); setEditingProduct(null) }}>
                  Add Product
                </Button>
              } />
              <CardContent>
                {showAddProduct && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-4">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Product Name"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                      />
                      <input
                        type="number"
                        placeholder="Sale Price"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={newProduct.sale_price}
                        onChange={(e) => setNewProduct({...newProduct, sale_price: Number(e.target.value)})}
                      />
                      <input
                        type="number"
                        placeholder="Credits Included"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={newProduct.credits_included}
                        onChange={(e) => setNewProduct({...newProduct, credits_included: Number(e.target.value)})}
                      />
                      <select
                        className="w-full px-3 py-2 border rounded-lg"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      <select
                        className="w-full px-3 py-2 border rounded-lg"
                        value={newProduct.status}
                        onChange={(e) => setNewProduct({...newProduct, status: e.target.value})}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Image URL"
                        className="w-full px-3 py-2 border rounded-lg md:col-span-2"
                        value={newProduct.image_url}
                        onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                      />
                      <textarea
                        placeholder="Description"
                        className="w-full px-3 py-2 border rounded-lg md:col-span-2"
                        rows={3}
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleSaveProduct}>
                        {editingProduct ? 'Update' : 'Add'} Product
                      </Button>
                      <Button variant="outline" onClick={() => { setShowAddProduct(false); setEditingProduct(null) }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <h3 className="font-semibold mb-3">All Products</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} className="border-b">
                          <td className="py-2">{product.name}</td>
                          <td className="py-2">
                            {product.sale_price ? (
                              <span>
                                <span className="text-red-600">R{product.sale_price}</span>
                                <span className="text-gray-400 line-through ml-2">R{product.price}</span>
                              </span>
                            ) : (
                              <span>R{product.price}</span>
                            )}
                          </td>
                          <td className="py-2">{product.category}</td>
                          <td className="py-2">
                            <Badge variant={product.status === 'active' ? 'success' : 'secondary'}>
                              {product.status}
                            </Badge>
                          </td>
                          <td className="py-2">
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingProduct(product)
                                  setNewProduct({
                                    name: product.name,
                                    description: product.description,
                                    price: product.price,
                                    sale_price: product.sale_price || 0,
                                    category: product.category,
                                    status: product.status,
                                    image_url: product.image_url || '',
                                    thumbnail_url: product.thumbnail_url || '',
                                    credits_included: product.credits_included || 0,
                                    is_featured: product.is_featured,
                                    sort_order: product.sort_order,
                                  })
                                  setShowAddProduct(true)
                                }}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader title="Orders" />
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2">Order ID</th>
                        <th className="pb-2">Product</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} className="border-b">
                          <td className="py-2 text-sm">{order.id.slice(0, 8)}...</td>
                          <td className="py-2">{order.product?.name || 'Unknown'}</td>
                          <td className="py-2">R{order.total_amount}</td>
                          <td className="py-2">
                            <Badge 
                              variant={
                                order.status === 'paid' || order.status === 'completed' ? 'success' :
                                order.status === 'pending' ? 'warning' :
                                order.status === 'cancelled' ? 'danger' : 'secondary'
                              }
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-2">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="py-2">
                            {order.status === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUpdateOrderStatus(order.id, 'paid')}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === cat.value 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
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
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                {product.image_url ? (
                  <div className="relative h-48 w-full rounded-t-xl overflow-hidden">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl flex items-center justify-center">
                    <span className="text-4xl">🏠</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    {product.credits_included ? (
                      <Badge variant="success">+{product.credits_included} Credits</Badge>
                    ) : null}
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
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

        {orders.length > 0 && !showAdminPanel && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Your Orders</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.slice(0, 5).map(order => (
                    <tr key={order.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.product?.name || 'Unknown Product'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Qty: {order.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        R{order.total_amount}
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={
                            order.status === 'paid' || order.status === 'completed' ? 'success' :
                            order.status === 'pending' ? 'warning' :
                            order.status === 'cancelled' ? 'danger' : 'secondary'
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
