'use client'

import { useState, useEffect } from 'react'
import { type RequestRow, type AttachmentRow } from '@/lib/database.types'
import { formatDate, formatFileSize } from '@/lib/utils'
import { statusConfig } from '@/components/ui/status-badge'
import { RequestChatPanel } from '@/components/admin/RequestChatPanel'
import { createClient } from '@/lib/supabase/client'
import { getSignedUrl } from '@/app/actions/attachments'
import {
  X,
  Calendar,
  Flag,
  CreditCard,
  Download,
  FileText,
  Image as ImageIcon,
  Film,
  File,
  Loader2,
  Check,
  Paperclip,
} from 'lucide-react'

interface ClientRequestDrawerProps {
  request: RequestRow | null
  open: boolean
  onClose: () => void
}

const STEPPER_STAGES = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'COMPLETED', label: 'Completed' },
] as const

function FileTypeIcon({ mimeType }: { mimeType: string | null }) {
  if (!mimeType) return <File className="w-4 h-4 text-slate-400" />
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-sky-400" />
  if (mimeType.startsWith('video/')) return <Film className="w-4 h-4 text-violet-400" />
  if (mimeType === 'application/pdf') return <FileText className="w-4 h-4 text-red-400" />
  return <File className="w-4 h-4 text-slate-400" />
}

export function ClientRequestDrawer({ request, open, onClose }: ClientRequestDrawerProps) {
  const [attachments, setAttachments] = useState<AttachmentRow[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)

  useEffect(() => {
    if (request && open) {
      fetchAttachments(request.id)
    }
  }, [request?.id, open])

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

  const statusInfo = statusConfig[request.status]
  const currentStepIdx = STEPPER_STAGES.findIndex((s) => s.value === request.status)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] bg-slate-950 border-l border-slate-800/80 flex flex-col shadow-2xl transform transition-transform duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-drawer-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
              {request.priority && (
                <span className="text-[10px] font-semibold text-slate-400 capitalize">
                  · {request.priority.toLowerCase()} Priority
                </span>
              )}
            </div>
            <h2 id="client-drawer-title" className="text-base font-semibold text-white leading-snug truncate">
              {request.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Progress Stepper */}
          <div className="space-y-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Project Status
            </label>
            <div className="grid grid-cols-4 gap-1.5 relative pt-1">
              {STEPPER_STAGES.map((stage, idx) => {
                const isCurrent = idx === currentStepIdx
                const isPassed = idx < currentStepIdx

                return (
                  <div
                    key={stage.value}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-violet-500/20 border-violet-500/50 text-white shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30'
                        : isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
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
                  </div>
                )
              })}
            </div>
          </div>

          {/* Meta Info Card */}
          <div className="grid grid-cols-2 gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-violet-400" /> Submitted Date
              </label>
              <p className="text-xs font-semibold text-slate-200">{formatDate(request.created_at)}</p>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Flag className="w-3.5 h-3.5 text-violet-400" /> Priority Level
              </label>
              <p className="text-xs font-semibold text-slate-200 capitalize">{request.priority?.toLowerCase() ?? 'Medium'}</p>
            </div>
            {request.due_date && (
              <div className="space-y-1 col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Paperclip className="w-3.5 h-3.5 text-violet-400" /> Estimated Due Date
                </label>
                <p className="text-xs font-semibold text-slate-200">
                  {new Date(request.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {request.description && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Description</label>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 rounded-xl px-4 py-3.5 border border-slate-800/80">
                {request.description}
              </p>
            </div>
          )}

          {/* Payment Link Banner */}
          {request.payment_link && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/30 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-white">Payment Required / Active Invoice</p>
                <p className="text-[11px] text-slate-400">Complete payment for this request to proceed.</p>
              </div>
              <a
                href={request.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex-shrink-0"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Pay Now
              </a>
            </div>
          )}

          {/* Attachments */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Uploaded Attachments ({attachments.length})
            </label>

            {loadingAttachments ? (
              <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading attachments…
              </div>
            ) : attachments.length === 0 ? (
              <p className="text-xs text-slate-500 py-1 italic">No file attachments attached to this request.</p>
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
                      type="button"
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

          {/* Embedded Real-Time Request Chat & Calls Panel */}
          <div className="pt-2">
            <RequestChatPanel requestId={request.id} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Panel
          </button>
        </div>
      </aside>
    </>
  )
}
