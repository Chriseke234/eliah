'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Inserts an attachment row after the file has been uploaded to Storage, and logs activity.
 */
export async function createAttachment(params: {
  requestId: string
  filePath: string
  fileName: string
  fileSize: number
  mimeType: string
}): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch request for org_id
  const { data: req } = await supabase
    .from('requests')
    .select('org_id')
    .eq('id', params.requestId)
    .single()

  if (!req) return { error: 'Associated request not found' }

  const { data: attachment, error } = await supabase
    .from('attachments')
    .insert({
      request_id: params.requestId,
      file_path: params.filePath,
      file_name: params.fileName,
      file_size: params.fileSize,
      mime_type: params.mimeType,
      uploaded_by: user.id,
    })
    .select('id')
    .single()

  if (error || !attachment) {
    console.error('[createAttachment]', error)
    return { error: error?.message ?? 'Failed to save attachment record' }
  }

  // Log activity
  await supabase.from('request_activity').insert({
    request_id: params.requestId,
    org_id: req.org_id,
    actor_id: user.id,
    action_type: 'ATTACHMENT_ADDED',
    details: `File "${params.fileName}" uploaded.`,
  })

  revalidatePath('/app/admin')
  revalidatePath('/app/client')

  return { id: attachment.id }
}

/**
 * Generates a signed URL for a storage attachment so it can be downloaded/previewed.
 */
export async function getSignedUrl(filePath: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('request-attachments')
    .createSignedUrl(filePath, 3600) // 1 hour

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create signed URL' }
  }

  return { url: data.signedUrl }
}

/**
 * Deletes an attachment from both the storage bucket and the DB table.
 */
export async function deleteAttachment(id: string, filePath: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error: storageError } = await supabase.storage
    .from('request-attachments')
    .remove([filePath])

  if (storageError) {
    console.error('[deleteAttachment] storage:', storageError)
  }

  const { error: dbError } = await supabase.from('attachments').delete().eq('id', id)

  if (dbError) {
    return { error: dbError.message }
  }

  revalidatePath('/app/admin')
  revalidatePath('/app/client')
  return {}
}

/**
 * Marks all unread notifications for the current user as read.
 */
export async function markNotificationsRead(): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) return { error: error.message }
  return {}
}
