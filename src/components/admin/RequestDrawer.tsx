'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateRequest } from '@/app/actions/requests'
import { getSignedUrl } from '@/app/actions/attachments'
import { createClient } from '@/lib/supabase/client'
import { type RequestWithClient, type RequestStatus, type AttachmentRow } from '@/lib/database.types'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatFileSize } from '@/lib/utils'
import {
  X,
  ExternalLink,
  Link2,
  Loader2,
  CheckCircle2,
  Download,
  FileText,
  Image as ImageIcon,
  Film,
  File,
  Calendar,
  User,
  Flag,
  Trash2,
} from 'lucide-react'

interface RequestDrawerProps {
  request: RequestWithClient | null
  open: boolean
  onClose: () => void
  onUpdate: (updated: Partial<RequestWithClient> & { id: string }) => void
}

const STATUS_OPTIONS: { value: RequestStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'COMPLETED', label: 'Completed' },
]

function FileTypeIcon({ mimeType }: { mimeType: string | null }) {
  if (!mimeType) return <File className="w-4 h-4" />
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
  if (mimeType.startsWith('video/')) return <Film className="w-4 h-4" />
  if (mimeType === 'application/pdf') return <FileText className="w-4 h-4 text-red-400" />
  return <File className="w-4 h-4" />
}

export function RequestDrawer({ request, open, onClose, onUpdate }: RequestDrawerProps) {
  const [status, setStatus] = useState<RequestStatus>('TODO')
  const [paymentLink, setPaymentLink] = useState('')
  const [attachments, setAttachments] = useState<AttachmentRow[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Sync form state when request changes
  useEffect(() => {
    if (request) {
      setStatus(request.status)
      setPaymentLink(request.payment_link ?? '')
      setSaveSuccess(false)
      setSaveError(null)
      fetchAttachments(request.id)
    }
  }, [request?.id])

  const fetchAttachments = async (requestId: string) => {
    setLoadingAttachments(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('attachments')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
    setAttachments((data as AttachmentRow[]) ?? [])
    setLoadingAttachments(false)
  }

  const handleSave = () => {
    if (!request) return
    setSaveError(null)

    startTransition(async () => {
      const result = await updateRequest(request.id, {
        status,
        payment_link: paymentLink.trim() || null,
      })

      if (result.error) {
        setSaveError(result.error)
        return
      }

      onUpdate({ id: request.id, status, payment_link: paymentLink.trim() || null })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    })
  }

  const handleDownload = async (attachment: AttachmentRow) => {
    const { url, error } = await getSignedUrl(attachment.file_path)
    if (error || !url) return
    const a = document.createElement('a')
    a.href = url
    a.download = attachment.file_name
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!open || !request) return null

  const clientName = request.users?.full_name || request.users?.email || 'Unknown Client'
  const hasChanges =
    status !== request.status ||
    (paymentLink.trim() || null) !== request.payment_link

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800/60 flex flex-col shadow-2xl transform transition-transform duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-800/60">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Request</p>
            <h2 id="drawer-title" className="text-base font-semibold text-white leading-snug">
              {request.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">
            {/* Meta info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <User className="w-3.5 h-3.5" /> Client
                </label>
                <p className="text-sm text-slate-200">{clientName}</p>
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Calendar className="w-3.5 h-3.5" /> Submitted
                </label>
                <p className="text-sm text-slate-200">{formatDate(request.created_at)}</p>
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Flag className="w-3.5 h-3.5" /> Priority
                </label>
                <p className="text-sm text-slate-200 capitalize">{request.priority?.toLowerCase() ?? 'Medium'}</p>
              </div>
              {request.due_date && (
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Calendar className="w-3.5 h-3.5" /> Due Date
                  </label>
                  <p className="text-sm text-slate-200">
                    {new Date(request.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {request.description && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700/40">
                  {request.description}
                </p>
              </div>
            )}

            {/* Status update */}
            <div className="space-y-2">
              <label htmlFor="drawer-status" className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      status === opt.value
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                    }`}
                    aria-pressed={status === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment link */}
            <div className="space-y-2">
              <label htmlFor="payment-link" className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Payment Link
              </label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="payment-link"
                  type="url"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="https://stripe.com/pay/..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700/60 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
              </div>
              {request.payment_link && (
                <a
                  href={request.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View current payment link
                </a>
              )}
            </div>

            {/* Save feedback */}
            {saveError && (
              <div role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div role="status" className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Changes saved
              </div>
            )}

            {/* Attachments */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Attachments ({attachments.length})
              </label>

              {loadingAttachments ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : attachments.length === 0 ? (
                <p className="text-xs text-slate-600 py-2">No attachments uploaded</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-lg border border-slate-700/40 group"
                    >
                      <div className="text-slate-400 flex-shrink-0">
                        <FileTypeIcon mimeType={att.mime_type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{att.file_name}</p>
                        <p className="text-xs text-slate-500">
                          {att.file_size ? formatFileSize(att.file_size) : ''} · {formatDate(att.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(att)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={`Download ${att.file_name}`}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800/60 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
