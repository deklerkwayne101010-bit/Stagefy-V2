// Login page - clean, calm, and minimal
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth, getDemoUsers } from '@/lib/auth-context'
import { isDemoMode } from '@/lib/demo-users'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // Initialize demo mode check synchronously (safe since isDemoMode() is synchronous)
  const [demoActive] = useState(() => isDemoMode())
  const demoUsers = getDemoUsers()

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('demo123') // Demo password for all demo users
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Add timeout to prevent getting stuck
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Login request timed out. Please try again.')), 15000)
    )

    try {
      const { error: authError } = await Promise.race([
        signIn(email, password),
        timeoutPromise
      ]) as any
      
      if (authError) {
        // Provide clear, user-friendly error messages
        const msg = authError.message || ''
        if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
          setError('Incorrect email or password. Please check your credentials and try again.')
        } else if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
          setError('Please verify your email address before signing in. Check your inbox for a confirmation link.')
        } else if (msg.includes('Too many requests') || msg.includes('rate_limit')) {
          setError('Too many login attempts. Please wait a few minutes and try again.')
        } else {
          setError(msg || 'Login failed. Please try again.')
        }
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-12">
          <Logo size="lg" />
        </Link>

        {/* Demo Mode Banner */}
        {demoActive && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-blue-800">Demo Mode Active</span>
            </div>
            <p className="text-sm text-blue-600 mb-3">
              Supabase is not configured. Use one of the demo accounts below:
            </p>
            <div className="space-y-2">
              {demoUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleDemoLogin(user.email)}
                  className="w-full text-left px-3 py-2 bg-white border border-blue-200 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-blue-800">{user.full_name}</span>
                      <span className="text-xs text-blue-500 ml-2">({user.role})</span>
                    </div>
                    <span className="text-xs text-blue-400">Click to login</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-medium text-[#1A1A2E] text-center">
            Welcome back
          </h1>
          <p className="text-gray-500 text-center mt-2 text-sm">
            Sign in to continue to your account
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm text-[#1A1A2E] hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#1A1A2E] hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}
