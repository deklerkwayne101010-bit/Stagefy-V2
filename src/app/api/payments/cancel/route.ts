// API route to cancel a subscription
import { NextResponse } from 'next/server'
import { cancelSubscription } from '@/lib/payfast'
import { getCurrentUser } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json()

    // Get current user
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const result = await cancelSubscription(subscriptionId)
    
    if (result.success) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: result.error }, { status: 400 })
  } catch (error) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
