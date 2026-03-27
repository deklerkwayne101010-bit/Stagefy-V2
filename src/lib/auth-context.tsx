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

  // Track if a refresh is already in progress to prevent race conditions
  const refreshInProgress = React.useRef(false)
  // Track if we've had a successful auth at least once in this session
  const hadSuccessfulAuth = React.useRef(false)

  const refreshUser = useCallback(async (retryCount = 0) => {
    // Prevent concurrent refresh calls from colliding
    if (refreshInProgress.current) {
      return
    }

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

    refreshInProgress.current = true

    try {
      // getCurrentUser already has internal timeouts (8s auth + 5s profile)
      // No need for an additional outer timeout that races against it
      const currentUser = await getCurrentUser()

      if (currentUser) {
        hadSuccessfulAuth.current = true
        setUser(currentUser)
      } else {
        // getCurrentUser returned null - this means no valid session
        // Only clear the user if we haven't had a successful auth yet this session,
        // OR if we've retried enough times. This prevents random logouts from
        // transient network issues.
        if (!hadSuccessfulAuth.current) {
          // First load and no session - user is not logged in
          setUser(null)
        } else if (retryCount < 2) {
          // We had a session before but got null - might be transient
          // Retry with backoff before giving up
          await new Promise(resolve => setTimeout(resolve, 1500 * (retryCount + 1)))
          refreshInProgress.current = false
          await refreshUser(retryCount + 1)
          return
        }
        // If hadSuccessfulAuth is true and retries exhausted with null,
        // keep the existing user state rather than logging them out.
        // A SIGNED_OUT event from Supabase will handle actual logout.
      }
    } catch (error: any) {
      console.error('Error refreshing user:', error?.message || error)

      if (retryCount < 2) {
        // Retry on error with exponential backoff
        const delay = 2000 * Math.pow(2, retryCount) // 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
        refreshInProgress.current = false
        await refreshUser(retryCount + 1)
        return
      }

      // Retries exhausted. Only log out if we never had a successful auth.
      // If we had a session before, keep it - the user will see stale data
      // rather than being randomly logged out. Next navigation/page load
      // will re-attempt auth.
      if (!hadSuccessfulAuth.current) {
        console.log('Max retries reached, no previous auth - setting user to null')
        setUser(null)
      } else {
        console.log('Max retries reached, but preserving existing session to prevent random logout')
      }
    } finally {
      refreshInProgress.current = false
    }
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
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Only refresh if we have an actual session with a user
          // This prevents cascading refresh calls after failed login attempts
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          hadSuccessfulAuth.current = false
          setUser(null)
        }
        // Ignore TOKEN_REFRESHED, INITIAL_SESSION, PASSWORD_RECOVERY, etc.
        // to avoid unnecessary refreshUser() calls that trigger timeout cascades
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
