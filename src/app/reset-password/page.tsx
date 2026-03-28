// Reset Password page - Set new password after clicking reset link
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)

  useEffect(() => {
    // Check if user has a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setIsValidToken(false)
        setError('This password reset link has expired. Please request a new one.')
      }
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      console.error('Password update error:', err)
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 bg-[#1A1A2E] rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <span className="text-2xl font-semibold text-[#1A1A2E]">Stagefy</span>
          </Link>

          {/* Error Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-medium text-[#1A1A2E]">
                Link Expired
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                {error}
              </p>
            </div>

            <Link href="/forgot-password">
              <Button fullWidth className="mt-6">
                Request New Reset Link
              </Button>
            </Link>

            <p className="mt-4 text-center text-sm text-gray-500">
              <Link href="/login" className="text-[#1A1A2E] hover:underline font-medium">
                ← Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 bg-[#1A1A2E] rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <span className="text-2xl font-semibold text-[#1A1A2E]">Stagefy</span>
          </Link>

          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-medium text-[#1A1A2E]">
                Password Updated
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                Your password has been successfully reset!
              </p>
              <p className="text-gray-400 text-sm mt-4">
                Redirecting to login in 3 seconds...
              </p>
            </div>

            <Link href="/login">
              <Button fullWidth className="mt-6">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-12 bg-[#1A1A2E] rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </div>
          <span className="text-2xl font-semibold text-[#1A1A2E]">Stagefy</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-xl font-medium text-[#1A1A2E]">
              Set new password
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Enter a new password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" fullWidth loading={loading}>
              Update Password
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/login" className="text-[#1A1A2E] hover:underline font-medium">
              ← Back to Login
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
