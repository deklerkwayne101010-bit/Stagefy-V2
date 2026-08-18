// Notification utility functions
import { getAdminClient } from './supabase'

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
    const adminClient = getAdminClient()
    if (!adminClient) {
      console.error('Admin client not available for notification')
      return { success: false, error: new Error('Admin client not available') }
    }

    const { error } = await adminClient
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
    const adminClient = getAdminClient()
    if (!adminClient) {
      return 0
    }

    const { count, error } = await adminClient
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
