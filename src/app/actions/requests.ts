'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type RequestInsert, type RequestUpdate, type UserRow } from '@/lib/database.types'

/**
 * Creates a new request for the authenticated client and logs activity.
 */
export async function createRequest(
  data: Pick<RequestInsert, 'title' | 'description' | 'priority' | 'due_date'>
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return { error: 'Not authenticated' }

  const { data: profileData } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as Pick<UserRow, 'org_id' | 'role'> | null

  if (!profile) return { error: 'User profile not found' }
  if (profile.role !== 'CLIENT') return { error: 'Only clients can create requests' }

  const { data: request, error } = await supabase
    .from('requests')
    .insert({
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? 'MEDIUM',
      due_date: data.due_date ?? null,
      client_id: user.id,
      org_id: profile.org_id,
    })
    .select('id')
    .single()

  if (error || !request) {
    console.error('[createRequest]', error)
    return { error: error?.message ?? 'Failed to create request' }
  }

  // Log activity
  await supabase.from('request_activity').insert({
    request_id: request.id,
    org_id: profile.org_id,
    actor_id: user.id,
    action_type: 'CREATED',
    details: `Request "${data.title}" submitted.`,
  })

  revalidatePath('/app/client')
  revalidatePath('/app/admin')

  return { id: request.id }
}

/**
 * Admin updates a request's status, payment_link, priority, or due_date, and logs activity.
 */
export async function updateRequest(
  id: string,
  data: Pick<RequestUpdate, 'status' | 'payment_link' | 'priority' | 'due_date'>
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch current request state for activity context
  const { data: currentReq } = await supabase
    .from('requests')
    .select('org_id, status, payment_link, priority, title')
    .eq('id', id)
    .single()

  if (!currentReq) return { error: 'Request not found' }

  const updatePayload: RequestUpdate = {}
  if (data.status !== undefined) updatePayload.status = data.status
  if (data.payment_link !== undefined) updatePayload.payment_link = data.payment_link
  if (data.priority !== undefined) updatePayload.priority = data.priority
  if (data.due_date !== undefined) updatePayload.due_date = data.due_date

  const { error } = await supabase
    .from('requests')
    .update(updatePayload)
    .eq('id', id)

  if (error) {
    console.error('[updateRequest]', error)
    return { error: error.message }
  }

  // Log specific activities
  if (data.status && data.status !== currentReq.status) {
    await supabase.from('request_activity').insert({
      request_id: id,
      org_id: currentReq.org_id,
      actor_id: user.id,
      action_type: 'STATUS_UPDATED',
      details: `Status changed from ${currentReq.status} to ${data.status}`,
    })
  }

  if (data.payment_link !== undefined && data.payment_link !== currentReq.payment_link) {
    await supabase.from('request_activity').insert({
      request_id: id,
      org_id: currentReq.org_id,
      actor_id: user.id,
      action_type: 'PAYMENT_LINK_ADDED',
      details: data.payment_link ? `External payment URL configured.` : `Payment link removed.`,
    })
  }

  if (data.priority && data.priority !== currentReq.priority) {
    await supabase.from('request_activity').insert({
      request_id: id,
      org_id: currentReq.org_id,
      actor_id: user.id,
      action_type: 'PRIORITY_UPDATED',
      details: `Priority updated to ${data.priority}`,
    })
  }

  revalidatePath('/app/admin')
  revalidatePath('/app/client')

  return {}
}

/**
 * Admin deletes a request.
 */
export async function deleteRequest(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from('requests').delete().eq('id', id)

  if (error) {
    console.error('[deleteRequest]', error)
    return { error: error.message }
  }

  revalidatePath('/app/admin')

  return {}
}
