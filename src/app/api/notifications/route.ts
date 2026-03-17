// Notifications API - Fetch user notifications
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user?.id) {
      return NextResponse.json({ notifications: [], unreadCount: 0 })
    }

    // Fetch notifications for the user
    const { data: notifications, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ notifications: [], unreadCount: 0 })
    }

    const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount
    })
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}
