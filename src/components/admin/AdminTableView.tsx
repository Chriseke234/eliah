'use client'

import { type RequestWithClient, type RequestStatus } from '@/lib/database.types'
import { formatRelativeDate } from '@/lib/utils'
import { CreditCard, Eye, Clock, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react'

interface AdminTableViewProps {
  requests: RequestWithClient[]
  onOpenDrawer: (request: RequestWithClient) => void
  onStatusChange: (requestId: string, newStatus: RequestStatus) => void
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; badgeClass: string }> = {
  TODO: { label: 'To Do', badgeClass: 'bg-slate-800 text-slate-300 border-slate-700' },
  IN_PROGRESS: { label: 'In Progress', badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  IN_REVIEW: { label: 'In Review', badgeClass: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
  COMPLETED: { label: 'Completed', badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
}

export function AdminTableView({ requests, onOpenDrawer, onStatusChange }: AdminTableViewProps) {
  if (requests.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center">
        <p className="text-slate-400 text-sm">No requests match your search or filters.</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Client</th>
              <th className="px-6 py-4 font-semibold">Request Title</th>
              <th className="px-6 py-4 font-semibold">Priority</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Payment</th>
              <th className="px-6 py-4 font-semibold">Submitted</th>
              <th className="px-6 py-4 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {requests.map((req) => {
              const clientName = req.users?.full_name || req.users?.email || 'Client'
              const initials = clientName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              const statusInfo = STATUS_CONFIG[req.status]

              return (
                <tr key={req.id} className="hover:bg-slate-800/40 transition-colors group">
                  {/* Client */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <span className="font-medium text-slate-200 truncate max-w-[140px]">{clientName}</span>
                    </div>
                  </td>

                  {/* Title */}
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                        {req.title}
                      </p>
                      {req.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{req.description}</p>
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-medium text-slate-300 capitalize px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/60">
                      {req.priority?.toLowerCase() ?? 'medium'}
                    </span>
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={req.status}
                      onChange={(e) => onStatusChange(req.id, e.target.value as RequestStatus)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border focus:outline-none focus:ring-2 focus:ring-violet-500/40 cursor-pointer ${statusInfo.badgeClass}`}
                    >
                      <option value="TODO" className="bg-slate-900 text-slate-200">To Do</option>
                      <option value="IN_PROGRESS" className="bg-slate-900 text-slate-200">In Progress</option>
                      <option value="IN_REVIEW" className="bg-slate-900 text-slate-200">In Review</option>
                      <option value="COMPLETED" className="bg-slate-900 text-slate-200">Completed</option>
                    </select>
                  </td>

                  {/* Payment status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {req.payment_link ? (
                      <a
                        href={req.payment_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Paid <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>

                  {/* Submitted */}
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatRelativeDate(req.created_at)}
                    </div>
                  </td>

                  {/* Action button */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => onOpenDrawer(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 text-xs font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-violet-400" /> View
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
