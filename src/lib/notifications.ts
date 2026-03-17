// Notification utility functions
import { supabase } from './supabase'

export interface CreateNotificationParams {
  userId: string
  type: 'job_completed' | 'payment' | 'crm' | 'credits' | 'system'
  title: string
  message?: string
  data?: Record<string, any>
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  data = {}
}: CreateNotificationParams) {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        is_read: false
      })

    if (error) {
      console.error('Error creating notification:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error }
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('Error getting unread count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error getting unread count:', error)
    return 0
  }
}
