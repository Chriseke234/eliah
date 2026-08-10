'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateRequest } from '@/app/actions/requests'
import { getSignedUrl } from '@/app/actions/attachments'
import { createClient } from '@/lib/supabase/client'
import { type RequestWithClient, type RequestStatus, type AttachmentRow, type RequestActivityRow } from '@/lib/database.types'
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
  History,
  Check,
} from 'lucide-react'

interface RequestDrawerProps {
  request: RequestWithClient | null
  open: boolean
  onClose: () => void
  onUpdate: (updated: Partial<RequestWithClient> & { id: string }) => void
}

const STEPPER_STAGES: { value: RequestStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'COMPLETED', label: 'Completed' },
]

function FileTypeIcon({ mimeType }: { mimeType: string | null }) {
  if (!mimeType) return <File className="w-4 h-4 text-slate-400" />
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-sky-400" />
  if (mimeType.startsWith('video/')) return <Film className="w-4 h-4 text-violet-400" />
  if (mimeType === 'application/pdf') return <FileText className="w-4 h-4 text-red-400" />
  return <File className="w-4 h-4 text-slate-400" />
}

export function RequestDrawer({ request, open, onClose, onUpdate }: RequestDrawerProps) {
  const [status, setStatus] = useState<RequestStatus>('TODO')
  const [paymentLink, setPaymentLink] = useState('')
  const [attachments, setAttachments] = useState<AttachmentRow[]>([])
  const [activities, setActivities] = useState<RequestActivityRow[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [loadingActivities, setLoadingActivities] = useState(false)
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
      fetchActivities(request.id)
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

  const fetchActivities = async (requestId: string) => {
    setLoadingActivities(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('request_activity')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })
    setActivities((data as RequestActivityRow[]) ?? [])
    setLoadingActivities(false)
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
      fetchActivities(request.id)
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

  const currentStepIdx = STEPPER_STAGES.findIndex((s) => s.value === status)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] bg-slate-950 border-l border-slate-800/80 flex flex-col shadow-2xl transform transition-transform duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-violet-400 mb-1 font-semibold uppercase tracking-wider">Request Details</p>
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
          <div className="px-6 py-6 space-y-6">

            {/* Visual Status Progress Stepper */}
            <div className="space-y-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Workflow Progress Stepper
              </label>
              <div className="grid grid-cols-4 gap-1.5 relative pt-1">
                {STEPPER_STAGES.map((stage, idx) => {
                  const isCurrent = idx === currentStepIdx
                  const isPassed = idx < currentStepIdx

                  return (
                    <button
                      key={stage.value}
                      type="button"
                      onClick={() => setStatus(stage.value)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-violet-500/20 border-violet-500/50 text-white shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30'
                          : isPassed
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isCurrent
                            ? 'bg-violet-500 text-white'
                            : isPassed
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                      </div>
                      <span className="text-[11px] font-medium leading-tight">{stage.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Meta info grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <User className="w-3.5 h-3.5 text-violet-400" /> Client
                </label>
                <p className="text-sm font-semibold text-slate-200 truncate">{clientName}</p>
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-violet-400" /> Submitted
                </label>
                <p className="text-sm font-semibold text-slate-200">{formatDate(request.created_at)}</p>
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Flag className="w-3.5 h-3.5 text-violet-400" /> Priority
                </label>
                <p className="text-sm font-semibold text-slate-200 capitalize">{request.priority?.toLowerCase() ?? 'Medium'}</p>
              </div>
              {request.due_date && (
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-violet-400" /> Due Date
                  </label>
                  <p className="text-sm font-semibold text-slate-200">
                    {new Date(request.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {request.description && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 rounded-xl px-4 py-3.5 border border-slate-800/80">
                  {request.description}
                </p>
              </div>
            )}

            {/* Payment link */}
            <div className="space-y-2">
              <label htmlFor="payment-link" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                External Client Payment Link
              </label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="payment-link"
                  type="url"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="https://stripe.com/pay/..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
              </div>
              {request.payment_link && (
                <a
                  href={request.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors pt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View active payment link
                </a>
              )}
            </div>

            {/* Save feedback */}
            {saveError && (
              <div role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div role="status" className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Changes updated successfully
              </div>
            )}

            {/* Attachments */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Attachments ({attachments.length})
              </label>

              {loadingAttachments ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading attachments…
                </div>
              ) : attachments.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 italic">No file attachments uploaded</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex-shrink-0">
                        <FileTypeIcon mimeType={att.mime_type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{att.file_name}</p>
                        <p className="text-[11px] text-slate-500">
                          {att.file_size ? formatFileSize(att.file_size) : ''} · {formatDate(att.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(att)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        aria-label={`Download ${att.file_name}`}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity History Timeline */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-violet-400" /> Activity History ({activities.length})
              </label>

              {loadingActivities ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading audit history…
                </div>
              ) : activities.length === 0 ? (
                <p className="text-xs text-slate-500 py-1 italic">No recorded activity history yet</p>
              ) : (
                <div className="space-y-4 relative pl-4 border-l border-slate-800/80">
                  {activities.map((act) => (
                    <div key={act.id} className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-violet-500 ring-4 ring-slate-950" />
                      <div className="flex items-center justify-between text-slate-300 font-medium">
                        <span className="capitalize">{act.action_type.replace('_', ' ')}</span>
                        <span className="text-[11px] text-slate-500">{formatDate(act.created_at)}</span>
                      </div>
                      {act.details && (
                        <p className="text-slate-400 mt-1 leading-relaxed">{act.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
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
