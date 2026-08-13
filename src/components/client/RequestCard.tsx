'use client'

import { type RequestRow } from '@/lib/database.types'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatRelativeDate } from '@/lib/utils'
import { CreditCard, Paperclip, Calendar, Flag, MessageSquare } from 'lucide-react'

interface RequestCardProps {
  request: RequestRow
  onClick?: () => void
}

const priorityConfig = {
  LOW: { label: 'Low', className: 'text-slate-400' },
  MEDIUM: { label: 'Medium', className: 'text-amber-400' },
  HIGH: { label: 'High', className: 'text-red-400' },
} as const

export function RequestCard({ request, onClick }: RequestCardProps) {
  const priority = priorityConfig[request.priority as keyof typeof priorityConfig] ?? priorityConfig.MEDIUM

  return (
    <article
      onClick={onClick}
      className="group bg-slate-900 border border-slate-800/60 rounded-xl p-5 hover:border-slate-700/80 hover:bg-slate-850/80 transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/40 cursor-pointer"
      aria-label={`Request: ${request.title}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-violet-300 transition-colors">
            {request.title}
          </h3>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Description */}
      {request.description && (
        <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
          {request.description}
        </p>
      )}

      {/* Footer meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          {formatRelativeDate(request.created_at)}
        </div>

        <div className={`flex items-center gap-1.5 text-xs ${priority.className}`}>
          <Flag className="w-3.5 h-3.5 flex-shrink-0" />
          {priority.label}
        </div>

        {request.due_date && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
            Due {new Date(request.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-violet-400 font-medium group-hover:text-violet-300 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            View Details & Chat
          </span>

          {/* Payment button — only shown when payment_link exists */}
          {request.payment_link && (
            <a
              href={request.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
              aria-label={`Pay now for: ${request.title}`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Pay Now
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

