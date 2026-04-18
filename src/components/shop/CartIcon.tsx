// Cart Icon Component with Badge
'use client'

import React from 'react'
import { useCart } from '@/lib/cart-context'
import { useRouter } from 'next/navigation'

export function CartIcon() {
  const router = useRouter()
  const { getItemCount } = useCart()
  const itemCount = getItemCount()

  return (
    <button
      onClick={() => router.push('/shop/cart')}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label="Shopping cart"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-gray-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  )
}