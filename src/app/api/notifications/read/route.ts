// Mark notifications as read API
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getUserFromAuthHeader(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  const client = createClient(supabaseUrl, supabaseAnonKey)
  try {
    const { data: { user }, error } = await client.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch { return null }
}

function getSupabaseClient(request: Request) {
  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromAuthHeader(request)

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient(request)

    const { notificationIds, markAllRead } = await request.json()

    if (markAllRead) {
      // Mark all notifications as read
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
      }
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('id', notificationIds)

      if (error) {
        console.error('Error marking notifications as read:', error)
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark notifications as read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
