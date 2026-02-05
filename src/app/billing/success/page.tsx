// Payment success page
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/Button'

function SuccessContent() {
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const paymentType = searchParams.get('type') || ''
  const packageName = searchParams.get('package') || ''
  const planName = searchParams.get('plan') || ''

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

  const getPackageDisplay = () => {
    const packages: Record<string, { name: string; credits: number }> = {
      '50-credits': { name: '50 Credits', credits: 50 },
      '100-credits': { name: '100 Credits', credits: 100 },
      '250-credits': { name: '250 Credits', credits: 250 },
      '500-credits': { name: '500 Credits', credits: 500 },
    }
    return packages[packageName] || { name: 'Credit Package', credits: 0 }
  }

  const getPlanDisplay = () => {
    const plans: Record<string, { name: string; credits: number }> = {
      'basic': { name: 'Basic', credits: 50 },
      'pro': { name: 'Pro', credits: 150 },
      'enterprise': { name: 'Enterprise', credits: 300 },
    }
    return plans[planName] || { name: 'Subscription Plan', credits: 0 }
  }

  const pkg = getPackageDisplay()
  const plan = getPlanDisplay()

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          <p className="text-slate-600 mb-6">
            {paymentType === 'subscription'
              ? `Your ${plan.name} subscription is now active.`
              : 'Your credits have been added to your account.'}
          </p>

          {/* Credit Info */}
          {paymentType === 'credits' && pkg.credits > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-600 mb-1">Credits Added</p>
              <p className="text-3xl font-bold text-blue-700">{pkg.credits}</p>
            </div>
          )}

          {paymentType === 'subscription' && plan.credits > 0 && (
            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-purple-600 mb-1">Monthly Credits</p>
              <p className="text-3xl font-bold text-purple-700">{plan.credits}</p>
            </div>
          )}

          {/* Next Steps */}
          <div className="space-y-3 mb-6">
            <p className="text-sm text-slate-500">What would you like to do next?</p>
            <Link href="/dashboard">
              <Button className="w-full" size="lg">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/photo-edit">
              <Button variant="outline" className="w-full" size="lg">
                Start Editing Photos
              </Button>
            </Link>
            <Link href="/billing">
              <Button variant="ghost" className="w-full" size="lg">
                View Billing History
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-xs text-slate-400">
            A confirmation email has been sent to your registered email address.
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

export default function SuccessPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingContent />}>
        <SuccessContent />
      </Suspense>
    </AuthProvider>
  )
}
