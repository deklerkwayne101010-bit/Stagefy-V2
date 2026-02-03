// API route to initiate PayFast payment
import { NextResponse } from 'next/server'
import { createCreditPayment, createSubscriptionPayment, SUBSCRIPTION_PLANS, CREDIT_PACKAGES } from '@/lib/payfast'
import { getCurrentUser } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { type, packageId, planId } = await request.json()

    // Get current user
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userEmail = user.email || ''
    const userName = user.full_name || 'Customer'

    if (type === 'credits') {
      const result = await createCreditPayment(user.id, packageId, userEmail, userName)
      if (result.success) {
        return NextResponse.json({ paymentUrl: result.paymentUrl })
      }
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    if (type === 'subscription') {
      const result = await createSubscriptionPayment(user.id, planId, userEmail, userName)
      if (result.success) {
        return NextResponse.json({ paymentUrl: result.paymentUrl })
      }
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get available plans and packages
export async function GET() {
  return NextResponse.json({
    subscriptions: Object.values(SUBSCRIPTION_PLANS),
    creditPackages: CREDIT_PACKAGES,
  })
}
