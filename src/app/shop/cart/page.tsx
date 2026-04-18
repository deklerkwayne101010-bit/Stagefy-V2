'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useCart, CartItem } from '@/lib/cart-context'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Image from 'next/image'

function CartItemCard({ item, onUpdateQuantity, onRemove }: { 
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}) {
  const displayPrice = item.salePrice || item.price

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              📦
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
          
          {(item.selectedColor || item.selectedSize) && (
            <p className="text-sm text-gray-500 mt-1">
              {[item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}
            </p>
          )}
          
          {item.customNotes && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
              Note: {item.customNotes}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            {/* Quantity Controls */}
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                className="px-3 py-1 hover:bg-gray-100 rounded-l-lg"
              >
                -
              </button>
              <span className="px-3 py-1 font-medium min-w-[40px] text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                className="px-3 py-1 hover:bg-gray-100 rounded-r-lg"
              >
                +
              </button>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="font-bold text-gray-900">
                R{(displayPrice * item.quantity).toFixed(2)}
              </p>
              {item.salePrice && (
                <p className="text-xs text-gray-400 line-through">
                  R{(item.price * item.quantity).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.productId)}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Remove item"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </Card>
  )
}

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, clearCart, getTotal, getItemCount } = useCart()
  const itemCount = getItemCount()
  const total = getTotal()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Button onClick={() => router.push('/shop')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600">{itemCount} item{itemCount !== 1 && 's'} in your cart</p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear Cart
          </button>
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>

        {/* Order Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>R{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>R{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/shop/checkout')}
              className="flex-1"
            >
              Proceed to Checkout
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/shop')}
            >
              Continue Shopping
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}