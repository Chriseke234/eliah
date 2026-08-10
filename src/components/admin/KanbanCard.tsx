'use client'

import { type RequestWithClient } from '@/lib/database.types'
import { formatRelativeDate } from '@/lib/utils'
import { CreditCard, Paperclip, GripVertical, Clock, UserCheck } from 'lucide-react'

interface KanbanCardProps {
  request: RequestWithClient
  onClick: () => void
}

// Unsplash avatar presets for clients
const CLIENT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
]

export function KanbanCard({ request, onClick }: KanbanCardProps) {
  const clientName = request.users?.full_name || request.users?.email || 'Client'
  const initials = clientName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  
  // Pick deterministic avatar index from client name
  const avatarIndex = (clientName.charCodeAt(0) + (clientName.charCodeAt(1) || 0)) % CLIENT_AVATARS.length
  const avatarUrl = CLIENT_AVATARS[avatarIndex]

  return (
    <article
      onClick={onClick}
      className="bg-slate-900/90 border border-slate-800/80 hover:border-violet-500/40 rounded-xl p-4 cursor-pointer hover:bg-slate-800/70 transition-all duration-200 group select-none shadow-md hover:shadow-xl hover:shadow-violet-950/20"
      aria-label={`Request: ${request.title}. Click to open details.`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors line-clamp-2 leading-snug">
            {request.title}
          </h3>
        </div>
      </div>

      {/* Description */}
      {request.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed pl-5">
          {request.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
        {/* Client Avatar + Name */}
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={avatarUrl}
            alt={clientName}
            className="w-5 h-5 rounded-full object-cover border border-slate-700/80 flex-shrink-0"
            onError={(e) => {
              // Hide image if fails and display fallback
              (e.target as HTMLElement).style.display = 'none'
            }}
          />
          <span className="text-xs text-slate-400 font-medium truncate">{clientName}</span>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {request.payment_link && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
              <CreditCard className="w-3 h-3" /> Paid
            </span>
          )}
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-600" />
            {formatRelativeDate(request.created_at)}
          </span>
        </div>
      </div>
    </article>
  )
}
