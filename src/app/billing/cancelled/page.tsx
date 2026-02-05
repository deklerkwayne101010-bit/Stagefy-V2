// Payment cancelled page
'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/Button'

function CancelledContent() {
  const { user, loading } = useAuth()

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

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Cancelled Icon */}
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
          <p className="text-slate-600 mb-6">
            You cancelled the payment process. No charges were made to your account.
          </p>

          {/* What to do next */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-slate-700 mb-2">No problem! You can:</p>
            <ul className="text-sm text-slate-600 text-left space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Try again with the same payment method
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Choose a different credit package or plan
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Contact our support team for assistance
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            <Link href="/billing">
              <Button className="w-full" size="lg">
                Return to Billing
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full" size="lg">
                Go to Dashboard
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-xs text-slate-400">
            If you experienced any issues with the payment process, please do not hesitate to reach out to our support team.
          </p>
        </div>
      </div>
    </div>
  )
}

function LoadingContent() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  )
}

export default function CancelledPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingContent />}>
        <CancelledContent />
      </Suspense>
    </AuthProvider>
  )
}
