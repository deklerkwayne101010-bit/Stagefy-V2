// Auth Events - Log signups and logins for admin history
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getUserFromAuthHeader(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
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
    const body = await request.json() as {
      eventType: 'signup' | 'login'
      userId?: string
      email?: string
    }

    const { eventType, userId, email } = body

    if (!eventType || (!userId && !email)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { error } = await (adminClient.from as any)('auth_events')
      .insert({
        user_id: userId || null,
        email: email || null,
        event_type: eventType,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Failed to log auth event:', error)
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Auth events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
