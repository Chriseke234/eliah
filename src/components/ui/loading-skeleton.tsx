import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-slate-800/60',
        className
      )}
      {...props}
    />
  )
}

/** Skeleton for a single request card */
export function RequestCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex items-center gap-3 pt-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

/** Skeleton for the client dashboard list */
export function RequestListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <RequestCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton for a kanban column */
export function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col gap-3 min-w-[280px]">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 space-y-2.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Skeleton for the kanban board */
export function KanbanSkeleton() {
  return (
    <div className="flex gap-5 overflow-x-auto pb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KanbanColumnSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton for a table row */
export function TableRowSkeleton() {
  return (
    <tr className="border-b border-slate-800/40">
      <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-48" /></td>
      <td className="py-4 px-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
      <td className="py-4 px-4"><Skeleton className="h-8 w-20 rounded-lg" /></td>
    </tr>
  )
}

export { Skeleton }
