// Settings layout - protected route
'use client'

import React, { useEffect } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { Sidebar } from '@/components/layout/Sidebar'
import { useRouter } from 'next/navigation'

function SettingsAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)]">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <SettingsAuth>{children}</SettingsAuth>
    </AuthProvider>
  )
}
