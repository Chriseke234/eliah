'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NotificationRow } from '@/lib/database.types'

/**
 * Returns notifications for the current authenticated user.
 */
export async function getUserNotifications(): Promise<{
  notifications: NotificationRow[]
  unreadCount: number
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { notifications: [], unreadCount: 0 }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[getUserNotifications]', error)
    return { notifications: [], unreadCount: 0 }
  }

  const list = (notifications ?? []) as NotificationRow[]
  const unreadCount = list.filter((n) => !n.read).length

  return { notifications: list, unreadCount }
}

/**
 * Marks a notification (or all notifications) as read.
 */
export async function markNotificationAsRead(
  notificationId?: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  let query = supabase.from('notifications').update({ read: true }).eq('user_id', user.id)

  if (notificationId) {
    query = query.eq('id', notificationId)
  }

  const { error } = await query

  if (error) {
    console.error('[markNotificationAsRead]', error)
    return { error: error.message }
  }

  revalidatePath('/app', 'layout')
  return { success: true }
}
