// Auth context for managing user state across the app
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from './types'
import { supabase, getCurrentUser } from './supabase'
import { isDemoMode, findDemoUser, demoUsers } from './demo-users'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  isDemo: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Initialize isDemo from environment - no need for useEffect
  const [isDemo] = useState(() => isDemoMode())

  const refreshUser = useCallback(async () => {
    if (isDemoMode()) {
      // In demo mode, check localStorage for logged in user
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('demoUser') : null
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      } else {
        setUser(null)
      }
      return
    }
    const currentUser = await getCurrentUser()
    setUser(currentUser)
  }, [])

  useEffect(() => {
    // Initialize auth in background - don't block rendering
    const initAuth = async () => {
      try {
        await refreshUser()
      } finally {
        setLoading(false)
      }
    }
    initAuth()

    // Listen for auth changes (only if not in demo mode)
    if (!isDemoMode()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string) => {
        if (event === 'SIGNED_IN') {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [refreshUser])

  const signIn = async (email: string, password: string) => {
    // Demo mode: allow any login with demo users
    if (isDemoMode()) {
      const demoUser = findDemoUser(email)
      if (demoUser) {
        setUser(demoUser)
        if (typeof window !== 'undefined') {
          localStorage.setItem('demoUser', JSON.stringify(demoUser))
        }
        return { error: null }
      }
      // Allow any email in demo mode, create a temporary user
      const tempUser: User = {
        id: `temp-${Date.now()}`,
        email,
        full_name: email.split('@')[0],
        role: 'agent',
        credits: 50,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setUser(tempUser)
      if (typeof window !== 'undefined') {
        localStorage.setItem('demoUser', JSON.stringify(tempUser))
      }
      return { error: null }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error ? new Error(error.message) : null }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    // Demo mode: simulate signup
    if (isDemoMode()) {
      const newUser: User = {
        id: `demo-${Date.now()}`,
        email,
        full_name: fullName,
        role: 'agent',
        credits: 50,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setUser(newUser)
      if (typeof window !== 'undefined') {
        localStorage.setItem('demoUser', JSON.stringify(newUser))
      }
      return { error: null }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error: error ? new Error(error.message) : null }
  }

  const signOut = async () => {
    if (isDemoMode()) {
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('demoUser')
      }
      return
    }
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser, isDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook to get demo users (for UI display)
export function getDemoUsers() {
  return demoUsers
}
