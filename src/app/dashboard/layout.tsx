// Dashboard layout with sidebar
'use client'

import React from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 min-h-screen">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
