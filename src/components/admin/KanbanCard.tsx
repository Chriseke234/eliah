'use client'

import { type RequestWithClient } from '@/lib/database.types'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatRelativeDate } from '@/lib/utils'
import { CreditCard, Paperclip, GripVertical } from 'lucide-react'

interface KanbanCardProps {
  request: RequestWithClient
  onClick: () => void
}

export function KanbanCard({ request, onClick }: KanbanCardProps) {
  const clientName = request.users?.full_name || request.users?.email || 'Unknown Client'
  const initials = clientName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <article
      onClick={onClick}
      className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 cursor-pointer hover:border-slate-700/80 hover:bg-slate-800/60 transition-all duration-200 group select-none"
      aria-label={`Request: ${request.title}. Click to open details.`}
    >
      {/* Drag handle + priority indicator */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
          <h3 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors line-clamp-2 leading-snug">
            {request.title}
          </h3>
        </div>
      </div>

      {/* Description preview */}
      {request.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {request.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        {/* Client avatar + name */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/40 to-indigo-500/40 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
            {initials}
          </div>
          <span className="text-xs text-slate-500 truncate">{clientName}</span>
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {request.payment_link && (
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" aria-label="Has payment link" />
          )}
          <span className="text-xs text-slate-600">{formatRelativeDate(request.created_at)}</span>
        </div>
      </div>
    </article>
  )
}
