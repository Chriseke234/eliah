'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type RequestCommentWithSender } from '@/lib/database.types'

/**
 * Posts a chat message / comment on a request.
 */
export async function postComment(params: {
  requestId: string
  message: string
  attachmentPath?: string
  attachmentName?: string
}): Promise<{ error?: string; comment?: RequestCommentWithSender }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Fetch request for org_id & client_id
    const { data: req } = await supabase
      .from('requests')
      .select('org_id, client_id, title')
      .eq('id', params.requestId)
      .single()

    if (!req) return { error: 'Associated request not found' }

    // Fetch caller's profile role
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    const senderName = profile?.full_name || 'Team Member'

    const { data: comment, error } = await supabase
      .from('request_comments')
      .insert({
        request_id: params.requestId,
        org_id: req.org_id,
        sender_id: user.id,
        message: params.message.trim(),
        attachment_path: params.attachmentPath || null,
        attachment_name: params.attachmentName || null,
      })
      .select(`
        *,
        sender:sender_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .single()

    if (error || !comment) {
      console.error('[postComment]', error)
      return { error: error?.message ?? 'Failed to post message' }
    }

    // Trigger notification to the counterpart user
    // If sender is CLIENT, notify org admins; if sender is ADMIN, notify client
    const targetUserId = profile?.role === 'CLIENT' ? null : req.client_id

    if (targetUserId) {
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        org_id: req.org_id,
        title: `New Comment on "${req.title}"`,
        body: `${senderName}: ${params.message.slice(0, 80)}`,
        type: 'INFO',
        request_id: params.requestId,
      })
    }

    revalidatePath('/app/admin')
    revalidatePath('/app/client')

    return { comment: comment as unknown as RequestCommentWithSender }
  } catch (err: any) {
    console.error('[postComment] Unexpected error:', err)
    return { error: err?.message ?? 'Failed to send message' }
  }
}

/**
 * Schedules a call link-out (Zoom, Google Meet, etc.) attached to a request.
 */
export async function scheduleCall(params: {
  requestId: string
  callLink: string
  callTitle?: string
}): Promise<{ error?: string; comment?: RequestCommentWithSender }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Clean call link URL
    let cleanLink = params.callLink.trim()
    if (!cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
      cleanLink = `https://${cleanLink}`
    }

    const { data: req } = await supabase
      .from('requests')
      .select('org_id, client_id, title')
      .eq('id', params.requestId)
      .single()

    if (!req) return { error: 'Request not found' }

    const { data: profile } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    const senderName = profile?.full_name || 'Team Member'
    const titleText = params.callTitle?.trim() || 'Scheduled Call'

    // Insert system comment with call card data
    const { data: comment, error } = await supabase
      .from('request_comments')
      .insert({
        request_id: params.requestId,
        org_id: req.org_id,
        sender_id: user.id,
        message: `Call scheduled — ${titleText} link added by ${senderName}`,
        call_link: cleanLink,
        call_title: titleText,
        is_system: true,
      })
      .select(`
        *,
        sender:sender_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .single()

    if (error || !comment) {
      console.error('[scheduleCall]', error)
      return { error: error?.message ?? 'Failed to attach call link' }
    }

    // Log in request activity
    await supabase.from('request_activity').insert({
      request_id: params.requestId,
      org_id: req.org_id,
      actor_id: user.id,
      action_type: 'STATUS_UPDATED',
      details: `Call scheduled: "${titleText}" link added by ${senderName}.`,
    })

    // Notify counterpart
    const targetUserId = profile?.role === 'CLIENT' ? null : req.client_id
    if (targetUserId) {
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        org_id: req.org_id,
        title: `Call Scheduled for "${req.title}"`,
        body: `${senderName} scheduled a call: ${titleText}`,
        type: 'SUCCESS',
        request_id: params.requestId,
      })
    }

    revalidatePath('/app/admin')
    revalidatePath('/app/client')

    return { comment: comment as unknown as RequestCommentWithSender }
  } catch (err: any) {
    console.error('[scheduleCall] Unexpected error:', err)
    return { error: err?.message ?? 'Failed to schedule call' }
  }
}

/**
 * Fetches comments / chat thread for a request.
 */
export async function getRequestComments(
  requestId: string
): Promise<RequestCommentWithSender[]> {
  try {
    const supabase = await createClient()

    const { data: comments, error } = await supabase
      .from('request_comments')
      .select(`
        *,
        sender:sender_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[getRequestComments]', error)
      return []
    }

    return (comments ?? []) as unknown as RequestCommentWithSender[]
  } catch (err) {
    console.error('[getRequestComments] error:', err)
    return []
  }
}
