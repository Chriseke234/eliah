'use client'

import { useState, useTransition } from 'react'
import { Video, X, Loader2, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react'
import { scheduleCall } from '@/app/actions/chat'

interface ScheduleCallModalProps {
  requestId: string
  open: boolean
  onClose: () => void
  onCallScheduled?: () => void
}

export function ScheduleCallModal({
  requestId,
  open,
  onClose,
  onCallScheduled,
}: ScheduleCallModalProps) {
  const [callLink, setCallLink] = useState('')
  const [callTitle, setCallTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!callLink.trim()) {
      setError('Please provide a meeting link (Zoom, Google Meet, etc.)')
      return
    }

    setError(null)
    startTransition(async () => {
      const res = await scheduleCall({
        requestId,
        callLink: callLink.trim(),
        callTitle: callTitle.trim() || undefined,
      })

      if (res.error) {
        setError(res.error)
        return
      }

      setCallLink('')
      setCallTitle('')
      onCallScheduled?.()
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-call-title"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Video className="w-4 h-4" />
            </div>
            <h3 id="schedule-call-title" className="text-base font-semibold text-white">
              Schedule a Call Link-Out
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Meeting Title */}
          <div className="space-y-1.5">
            <label htmlFor="call-title" className="block text-xs font-medium text-slate-300">
              Meeting Title / Label (Optional)
            </label>
            <input
              id="call-title"
              type="text"
              value={callTitle}
              onChange={(e) => setCallTitle(e.target.value)}
              placeholder="e.g. Design Review Sync & Q&A"
              disabled={isPending}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          {/* Call Link */}
          <div className="space-y-1.5">
            <label htmlFor="call-link" className="block text-xs font-medium text-slate-300">
              Zoom / Google Meet / Teams Link
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="call-link"
                type="url"
                required
                value={callLink}
                onChange={(e) => setCallLink(e.target.value)}
                placeholder="https://zoom.us/j/123456789 or https://meet.google.com/abc-defg-hij"
                disabled={isPending}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Paste your external meeting URL. Eliah will post an interactive &quot;Upcoming Call&quot; card in the chat.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !callLink.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all disabled:opacity-50 shadow-md shadow-violet-600/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Attaching...
                </>
              ) : (
                'Attach Call Link'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
