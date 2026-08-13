'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type UserRow, type OrgUpdate } from '@/lib/database.types'

export async function updateOrganizationBranding(params: {
  name: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  customDomain?: string
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check caller role
  const { data: profile } = await supabase
    .from('users')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  const userProfile = profile as Pick<UserRow, 'role' | 'org_id'> | null

  if (userProfile?.role !== 'ADMIN') {
    return { error: 'Only organization administrators can update branding settings' }
  }

  // Clean custom domain if provided
  let cleanDomain: string | null = null
  if (params.customDomain?.trim()) {
    cleanDomain = params.customDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
  }

  // Check if customDomain is already in use by another organization
  if (cleanDomain) {
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('custom_domain', cleanDomain)
      .neq('id', userProfile.org_id)
      .maybeSingle()

    if (existingOrg) {
      return { error: `Domain '${cleanDomain}' is already assigned to another agency.` }
    }
  }

  const updateData: OrgUpdate = {
    name: params.name,
    logo_url: params.logoUrl || null,
    primary_color: params.primaryColor || '#8b5cf6',
    secondary_color: params.secondaryColor || '#6366f1',
    custom_domain: cleanDomain,
  }

  const { error } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', userProfile.org_id)

  if (error) {
    console.error('[updateOrganizationBranding]', error)
    return { error: error.message }
  }

  revalidatePath('/app/admin/settings')
  revalidatePath('/app', 'layout')

  return { success: true }
}
