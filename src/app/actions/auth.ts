'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type UserRow } from '@/lib/database.types'

interface SignUpParams {
  orgName: string
  fullName: string
  email: string
  password: string
}

/**
 * Creates a new organization and signs up the first admin user.
 * Steps:
 * 1. Create organization row
 * 2. Sign up the user via Supabase Auth with org_id + role in metadata
 *    → the on_auth_user_created trigger inserts the public.users row
 * 3. Ensure public.users fallback insert if trigger is delayed
 */
export async function signUpWithOrg({
  orgName,
  fullName,
  email,
  password,
}: SignUpParams): Promise<{ error?: string; requiresConfirmation?: boolean; success?: boolean }> {
  try {
    const supabase = await createClient()

    let adminSupabase: any = null
    try {
      adminSupabase = await createAdminClient()
    } catch (err: any) {
      console.warn('[signUpWithOrg] createAdminClient unavailable:', err?.message)
    }

    const dbClient = adminSupabase ?? supabase

    // 1. Create the organization row
    const baseSlug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'agency'
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`

    let org: { id: string } | null = null
    let orgError: any = null

    const primaryAttempt = await dbClient
      .from('organizations')
      .insert({ name: orgName, slug })
      .select('id')
      .single()

    if (primaryAttempt.error && dbClient !== supabase) {
      // Fallback to anon client if service role key fails
      console.warn('[signUpWithOrg] Service role org insert failed, trying anon client:', primaryAttempt.error.message)
      const secondaryAttempt = await supabase
        .from('organizations')
        .insert({ name: orgName, slug })
        .select('id')
        .single()
      org = secondaryAttempt.data
      orgError = secondaryAttempt.error
    } else {
      org = primaryAttempt.data
      orgError = primaryAttempt.error
    }

    if (orgError || !org) {
      console.error('[signUpWithOrg] org insert error:', orgError)
      return { error: orgError?.message ?? 'Failed to create organization. Please check database permissions.' }
    }

    // 2. Sign up the user with metadata that the DB trigger will use
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          org_id: org.id,
          full_name: fullName,
          role: 'ADMIN',
        },
      },
    })

    if (authError) {
      // Roll back org creation if user signup fails
      await dbClient.from('organizations').delete().eq('id', org.id)
      console.error('[signUpWithOrg] auth signup error:', authError)
      return { error: authError.message }
    }

    // 3. Ensure public.users row exists (fallback in case trigger is delayed)
    if (authData.user) {
      const { data: existingUser } = await dbClient
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (!existingUser) {
        const { error: userInsertError } = await dbClient.from('users').insert({
          id: authData.user.id,
          org_id: org.id,
          role: 'ADMIN',
          full_name: fullName,
          email: authData.user.email ?? email,
        })
        if (userInsertError) {
          console.error('[signUpWithOrg] public.users fallback insert error:', userInsertError)
        }
      }
    }

    if (!authData.session) {
      return { requiresConfirmation: true }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[signUpWithOrg] Unexpected server exception:', err)
    return { error: err?.message ?? 'An unexpected error occurred during signup. Please try again.' }
  }
}

/**
 * Signs out the currently authenticated user.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}

/**
 * Admin creates a new CLIENT account in their org.
 * Supports both email invitation link generation and manual password assignment.
 */
export async function createClientAccount(params: {
  email: string
  fullName: string
  password?: string
  inviteMethod?: 'email' | 'password'
}): Promise<{ error?: string; userId?: string; inviteLink?: string; invited?: boolean }> {
  try {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    // Verify caller is an ADMIN
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: callerProfileData } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', user.id)
      .single()

    const callerProfile = callerProfileData as Pick<UserRow, 'role' | 'org_id'> | null

    if (callerProfile?.role !== 'ADMIN') {
      return { error: 'Only admins can create client accounts' }
    }

    const orgId = callerProfile.org_id
    const method = params.inviteMethod ?? (params.password ? 'password' : 'email')

    if (method === 'email') {
      // 1. Send invite email & generate magic invite link
      const { data: inviteData, error: inviteError } =
        await adminSupabase.auth.admin.inviteUserByEmail(params.email, {
          data: {
            org_id: orgId,
            full_name: params.fullName,
            role: 'CLIENT',
          },
        })

      // Generate action link so admin can copy the invite link immediately
      const { data: linkData } = await adminSupabase.auth.admin.generateLink({
        type: 'invite',
        email: params.email,
        options: {
          data: {
            org_id: orgId,
            full_name: params.fullName,
            role: 'CLIENT',
          },
        },
      })

      if (inviteError && !linkData?.properties?.action_link) {
        return { error: inviteError.message }
      }

      const createdUserId = inviteData?.user?.id ?? linkData?.user?.id
      const actionLink = linkData?.properties?.action_link

      revalidatePath('/app/admin/clients')
      return {
        userId: createdUserId,
        inviteLink: actionLink,
        invited: true,
      }
    } else {
      // 2. Direct manual password creation
      if (!params.password || params.password.length < 8) {
        return { error: 'Password must be at least 8 characters long' }
      }

      const { data: newAuthUser, error: authError } =
        await adminSupabase.auth.admin.createUser({
          email: params.email,
          password: params.password,
          email_confirm: true,
          user_metadata: {
            org_id: orgId,
            full_name: params.fullName,
            role: 'CLIENT',
          },
        })

      if (authError || !newAuthUser.user) {
        return { error: authError?.message ?? 'Failed to create user' }
      }

      revalidatePath('/app/admin/clients')
      return { userId: newAuthUser.user.id }
    }
  } catch (err: any) {
    console.error('[createClientAccount] Unexpected exception:', err)
    return { error: err?.message ?? 'Failed to create client account' }
  }
}
