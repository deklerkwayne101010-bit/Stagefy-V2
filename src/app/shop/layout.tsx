'use client'

import React from 'react'
import { CartProvider } from '@/lib/cart-context'
import { CartIcon } from '@/components/shop/CartIcon'
import Link from 'next/link'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Shop Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/shop" className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                <span className="text-xl font-bold text-gray-900">Stagefy Shop</span>
              </Link>

              {/* Navigation */}
              <nav className="flex items-center gap-4">
                <Link 
                  href="/shop" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Products
                </Link>
                <CartIcon />
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {children}
        </main>
      </div>
    </CartProvider>
  )
}