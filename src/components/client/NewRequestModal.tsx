'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createRequest } from '@/app/actions/requests'
import { createAttachment } from '@/app/actions/attachments'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import { type Priority } from '@/lib/database.types'

interface NewRequestModalProps {
  open: boolean
  onClose: () => void
  userId: string
}

interface FileWithPreview {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  errorMessage?: string
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/quicktime',
]
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export function NewRequestModal({ open, onClose, userId }: NewRequestModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    due_date: '',
  })

  const addFiles = (incoming: File[]) => {
    const valid = incoming
      .filter((f) => {
        if (!ACCEPTED_TYPES.includes(f.type)) return false
        if (f.size > MAX_FILE_SIZE) return false
        return true
      })
      .map((f) => ({ file: f, id: crypto.randomUUID(), status: 'pending' as const }))
    setFiles((prev) => [...prev, ...valid])
  }

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id))

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Please enter a title for your request')
      return
    }
    setError(null)

    startTransition(async () => {
      // 1. Create the request row
      const result = await createRequest({
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        due_date: form.due_date || null,
      })

      if (result.error || !result.id) {
        setError(result.error ?? 'Failed to create request')
        return
      }

      const requestId = result.id
      const supabase = createClient()

      // 2. Upload files to storage then create attachment rows
      for (const fileEntry of files) {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileEntry.id ? { ...f, status: 'uploading' } : f))
        )

        const ext = fileEntry.file.name.split('.').pop()
        const filePath = `${userId}/${requestId}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('request-attachments')
          .upload(filePath, fileEntry.file, { contentType: fileEntry.file.type })

        if (uploadError) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileEntry.id
                ? { ...f, status: 'error', errorMessage: uploadError.message }
                : f
            )
          )
          continue
        }

        await createAttachment({
          requestId,
          filePath,
          fileName: fileEntry.file.name,
          fileSize: fileEntry.file.size,
          mimeType: fileEntry.file.type,
        })

        setFiles((prev) =>
          prev.map((f) => (f.id === fileEntry.id ? { ...f, status: 'done' } : f))
        )
      }

      setSuccess(true)
      setTimeout(() => {
        router.refresh()
        handleClose()
      }, 1200)
    })
  }

  const handleClose = () => {
    if (isPending) return
    setForm({ title: '', description: '', priority: 'MEDIUM', due_date: '' })
    setFiles([])
    setError(null)
    setSuccess(false)
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-request-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative w-full sm:max-w-lg bg-slate-900 border border-slate-800/60 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <h2 id="new-request-title" className="text-base font-semibold text-white">
            New Request
          </h2>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="req-title" className="block text-sm font-medium text-slate-300">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="req-title"
                type="text"
                required
                maxLength={200}
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Landing page redesign"
                disabled={isPending}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700/60 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="req-desc" className="block text-sm font-medium text-slate-300">
                Description
              </label>
              <textarea
                id="req-desc"
                rows={3}
                maxLength={2000}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe what you need…"
                disabled={isPending}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700/60 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none"
              />
            </div>

            {/* Priority + Due date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="req-priority" className="block text-sm font-medium text-slate-300">
                  Priority
                </label>
                <select
                  id="req-priority"
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as Priority }))}
                  disabled={isPending}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="req-due" className="block text-sm font-medium text-slate-300">
                  Due date
                </label>
                <input
                  id="req-due"
                  type="date"
                  value={form.due_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                  disabled={isPending}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Attachments</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-violet-500/60 bg-violet-500/5'
                    : 'border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/30'
                }`}
                role="button"
                tabIndex={0}
                aria-label="Upload files"
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  <span className="text-violet-400 font-medium">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-slate-600 mt-1">PDF, images, Word, video — max 50MB each</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES.join(',')}
                  onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
                  className="sr-only"
                  aria-label="File input"
                />
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2 mt-3">
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-lg border border-slate-700/40"
                    >
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{f.file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(f.file.size)}</p>
                      </div>
                      {f.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />
                      )}
                      {f.status === 'done' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      {f.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      {f.status === 'pending' && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(f.id) }}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                          aria-label={`Remove ${f.file.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div role="status" className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Request submitted successfully!
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-800/60 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !form.title.trim() || success}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
