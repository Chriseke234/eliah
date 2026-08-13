'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Mail, Calendar, User, FileText, Clock, ExternalLink, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { type UserRow, type RequestRow } from '@/lib/database.types'
import { formatDate } from '@/lib/utils'
import { statusConfig } from '@/components/ui/status-badge'
import { createClient } from '@/lib/supabase/client'
import { deleteClientAccount } from '@/app/actions/auth'

interface ClientDetailDrawerProps {
  client: UserRow | null
  open: boolean
  onClose: () => void
}

export function ClientDetailDrawer({ client, open, onClose }: ClientDetailDrawerProps) {
  const router = useRouter()
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!client || !open) return

    setShowConfirm(false)
    setDeleteError(null)

    const loadClientRequests = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('requests')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      setRequests(data ?? [])
      setLoading(false)
    }

    loadClientRequests()
  }, [client, open])

  const handleDeleteClient = () => {
    if (!client) return
    setDeleteError(null)

    startTransition(async () => {
      const result = await deleteClientAccount({ clientId: client.id })

      if (result.error) {
        setDeleteError(result.error)
        return
      }

      setShowConfirm(false)
      onClose()
      router.refresh()
    })
  }

  if (!open || !client) return null

  const initials = client.full_name
    ? client.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : client.email.slice(0, 2).toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-detail-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={isPending ? undefined : onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 id="client-detail-title" className="text-base font-semibold text-white truncate">
                  {client.full_name || 'Client Details'}
                </h2>
                <p className="text-xs text-slate-400 truncate">{client.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Contact Info Card */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Contact Information
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2 text-slate-400">
                    <User className="w-3.5 h-3.5 text-violet-400" /> Full Name
                  </span>
                  <span className="font-medium text-white">{client.full_name || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-violet-400" /> Email Address
                  </span>
                  <span className="font-medium text-white">{client.email}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-violet-400" /> Joined Date
                  </span>
                  <span className="font-medium text-slate-300">{formatDate(client.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Request History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" /> Request History
                </h3>
                <span className="text-xs text-slate-400 font-semibold bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full">
                  {requests.length} total
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading request history...</div>
              ) : requests.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl space-y-1">
                  <p className="text-xs font-medium text-slate-400">No requests submitted yet</p>
                  <p className="text-[11px] text-slate-500">This client has not created any project requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((r) => {
                    const statusInfo = statusConfig[r.status]
                    return (
                      <div
                        key={r.id}
                        className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-white line-clamp-1">{r.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        {r.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">{r.description}</p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" /> {formatDate(r.created_at)}
                          </span>
                          {r.payment_link && (
                            <a
                              href={r.payment_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                            >
                              Payment Link <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer: Delete Actions */}
          <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
            {deleteError && (
              <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {deleteError}
              </div>
            )}

            {!showConfirm ? (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove Client from Agency
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">Confirm Client Removal</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Are you sure you want to remove <strong className="text-slate-200">{client.full_name || client.email}</strong> from your agency portal? This will revoke their access and delete their account.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    disabled={isPending}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteClient}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors shadow-lg shadow-red-600/20"
                  >
                    {isPending ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Removing...</>
                    ) : (
                      <><Trash2 className="w-3.5 h-3.5" /> Confirm Remove</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

