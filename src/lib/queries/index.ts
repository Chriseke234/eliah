import { createClient } from '@/lib/supabase/server'
import {
  type UserRow,
  type OrgRow,
  type RequestWithClient,
  type RequestRow,
  type RequestActivityRow,
} from '@/lib/database.types'

/**
 * Returns the currently authenticated user's profile row from public.users.
 */
export async function getCurrentProfile(): Promise<UserRow | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) return profile as UserRow

  // Metadata fallback if user row hasn't synced
  const meta = user.user_metadata ?? {}
  if (meta.org_id && meta.role) {
    return {
      id: user.id,
      org_id: meta.org_id,
      role: meta.role,
      full_name: meta.full_name ?? user.email?.split('@')[0] ?? 'User',
      email: user.email ?? '',
      avatar_url: null,
      created_at: new Date().toISOString(),
    }
  }

  return null
}

/**
 * Returns organization details including branding settings for the given org_id.
 */
export async function getOrganizationDetails(orgId: string): Promise<OrgRow | null> {
  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .maybeSingle()

  return org as OrgRow | null
}

/**
 * Returns all requests belonging to the organization for the Admin workspace.
 */
export async function getAdminRequests(orgId: string): Promise<RequestWithClient[]> {
  const supabase = await createClient()
  const { data: requests, error } = await supabase
    .from('requests')
    .select(`
      *,
      users:client_id (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getAdminRequests]', error)
    return []
  }

  return (requests ?? []) as unknown as RequestWithClient[]
}

/**
 * Returns requests submitted by a specific client.
 */
export async function getClientRequests(clientId: string): Promise<RequestRow[]> {
  const supabase = await createClient()
  const { data: requests, error } = await supabase
    .from('requests')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getClientRequests]', error)
    return []
  }

  return requests ?? []
}

/**
 * Returns activity log history for a specific request.
 */
export async function getRequestActivity(requestId: string): Promise<RequestActivityRow[]> {
  const supabase = await createClient()
  const { data: activities, error } = await supabase
    .from('request_activity')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getRequestActivity]', error)
    return []
  }

  return activities ?? []
}
