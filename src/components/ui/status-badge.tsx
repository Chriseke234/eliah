import { type RequestStatus } from '@/lib/database.types'
import { cn } from '@/lib/utils'

const statusConfig: Record<
  RequestStatus,
  { label: string; className: string; dotClass: string }
> = {
  TODO: {
    label: 'To Do',
    className: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    dotClass: 'bg-slate-400',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    dotClass: 'bg-amber-400',
  },
  IN_REVIEW: {
    label: 'In Review',
    className: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    dotClass: 'bg-blue-400',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    dotClass: 'bg-emerald-400',
  },
}

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dotClass)} />
      {config.label}
    </span>
  )
}

export { statusConfig }
