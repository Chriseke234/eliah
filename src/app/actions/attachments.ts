'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type AttachmentRow } from '@/lib/database.types'

/**
 * Inserts an attachment row after the file has been uploaded to Storage.
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

  const { data: attachmentData, error } = await (supabase
    .from('attachments') as any)
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

  const data = attachmentData as Pick<AttachmentRow, 'id'> | null

  if (error || !data) {
    console.error('[createAttachment]', error)
    return { error: error?.message ?? 'Failed to save attachment record' }
  }

  revalidatePath('/app/admin')
  revalidatePath('/app/client')

  return { id: data.id }
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
    // Continue even if storage delete fails — remove DB row
  }

  const { error: dbError } = await supabase.from('attachments').delete().eq('id', id)

  if (dbError) {
    return { error: dbError.message }
  }

  revalidatePath('/app/admin')
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

  const { error } = await (supabase
    .from('notifications') as any)
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) return { error: error.message }
  return {}
}
