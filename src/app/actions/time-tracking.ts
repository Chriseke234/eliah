'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type RequestTimeEntryRow } from '@/lib/database.types'

/**
 * Starts a new live time tracking session for a request.
 */
export async function startTimeTracking(
  requestId: string
): Promise<{ error?: string; entry?: RequestTimeEntryRow }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Fetch request to get org_id
    const { data: request } = await supabase
      .from('requests')
      .select('org_id')
      .eq('id', requestId)
      .single()

    if (!request) return { error: 'Request not found' }

    // Check if there is already an active timer running for this user & request
    const { data: existingActive } = await supabase
      .from('request_time_entries')
      .select('*')
      .eq('request_id', requestId)
      .eq('user_id', user.id)
      .is('end_time', null)
      .maybeSingle()

    if (existingActive) {
      return { entry: existingActive as RequestTimeEntryRow }
    }

    const startTime = new Date().toISOString()

    const { data: newEntry, error } = await supabase
      .from('request_time_entries')
      .insert({
        request_id: requestId,
        org_id: request.org_id,
        user_id: user.id,
        start_time: startTime,
      })
      .select('*')
      .single()

    if (error || !newEntry) {
      console.error('[startTimeTracking]', error)
      return { error: error?.message ?? 'Failed to start timer' }
    }

    revalidatePath('/app/admin')
    return { entry: newEntry as RequestTimeEntryRow }
  } catch (err: any) {
    console.error('[startTimeTracking] Unexpected error:', err)
    return { error: err?.message ?? 'Failed to start time tracking' }
  }
}

/**
 * Stops an active time tracking session and logs duration.
 */
export async function stopTimeTracking(
  entryId: string
): Promise<{ error?: string; entry?: RequestTimeEntryRow; durationSeconds?: number }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Fetch existing entry
    const { data: existing } = await supabase
      .from('request_time_entries')
      .select('*')
      .eq('id', entryId)
      .single()

    if (!existing) return { error: 'Time entry not found' }

    const endTime = new Date()
    const startTime = new Date(existing.start_time)
    const durationSeconds = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 1000))

    const { data: updated, error } = await supabase
      .from('request_time_entries')
      .update({
        end_time: endTime.toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', entryId)
      .select('*')
      .single()

    if (error || !updated) {
      console.error('[stopTimeTracking]', error)
      return { error: error?.message ?? 'Failed to stop timer' }
    }

    // Format duration text for audit log
    const minutes = Math.floor(durationSeconds / 60)
    const hours = Math.floor(minutes / 60)
    const remMinutes = minutes % 60
    const durationText = hours > 0 ? `${hours}h ${remMinutes}m` : `${minutes}m`

    // Log activity entry
    await supabase.from('request_activity').insert({
      request_id: existing.request_id,
      org_id: existing.org_id,
      actor_id: user.id,
      action_type: 'STATUS_UPDATED',
      details: `Logged ${durationText} of work time.`,
    })

    revalidatePath('/app/admin')
    return { entry: updated as RequestTimeEntryRow, durationSeconds }
  } catch (err: any) {
    console.error('[stopTimeTracking] Unexpected error:', err)
    return { error: err?.message ?? 'Failed to stop time tracking' }
  }
}

/**
 * Fetches time tracking summary and entries for a request.
 */
export async function getRequestTimeSummary(requestId: string): Promise<{
  entries: RequestTimeEntryRow[]
  totalSeconds: number
  activeEntry: RequestTimeEntryRow | null
}> {
  try {
    const supabase = await createClient()

    const { data: entries, error } = await supabase
      .from('request_time_entries')
      .select('*')
      .eq('request_id', requestId)
      .order('start_time', { ascending: false })

    if (error) {
      console.error('[getRequestTimeSummary]', error)
      return { entries: [], totalSeconds: 0, activeEntry: null }
    }

    const list = (entries ?? []) as RequestTimeEntryRow[]
    const activeEntry = list.find((e) => !e.end_time) ?? null
    const totalSeconds = list.reduce((sum, e) => sum + (e.duration_seconds || 0), 0)

    return { entries: list, totalSeconds, activeEntry }
  } catch (err) {
    console.error('[getRequestTimeSummary] error:', err)
    return { entries: [], totalSeconds: 0, activeEntry: null }
  }
}
