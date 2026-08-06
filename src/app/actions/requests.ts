'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type RequestInsert, type RequestUpdate, type UserRow, type RequestRow } from '@/lib/database.types'

/**
 * Creates a new request for the authenticated client.
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

  const { data: requestData, error } = await (supabase
    .from('requests') as any)
    .insert({
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? 'MEDIUM',
      due_date: data.due_date ?? null,
      client_id: user.id,
      org_id: profile!.org_id,
    })
    .select('id')
    .single()

  const request = requestData as Pick<RequestRow, 'id'> | null

  if (error || !request) {
    console.error('[createRequest]', error)
    return { error: error?.message ?? 'Failed to create request' }
  }

  revalidatePath('/app/client')
  revalidatePath('/app/admin')

  return { id: request.id }
}

/**
 * Admin updates a request's status and/or payment_link.
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

  const { error } = await (supabase
    .from('requests') as any)
    .update({
      ...(data.status !== undefined && { status: data.status }),
      ...(data.payment_link !== undefined && { payment_link: data.payment_link }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.due_date !== undefined && { due_date: data.due_date }),
    })
    .eq('id', id)

  if (error) {
    console.error('[updateRequest]', error)
    return { error: error.message }
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
