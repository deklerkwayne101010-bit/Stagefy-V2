// API route to cancel a subscription
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cancelSubscription } from '@/lib/payfast'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Helper to get user from Authorization header
async function getUserFromAuthHeader(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  const client = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const { data: { user }, error } = await client.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json()

    // Get current user from auth header
    const user = await getUserFromAuthHeader(request)
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
