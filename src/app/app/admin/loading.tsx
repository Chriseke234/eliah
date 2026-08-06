import { KanbanSkeleton } from '@/components/ui/loading-skeleton'

export default function AdminLoading() {
  return (
    <div className="min-h-full bg-slate-950">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-36 rounded-lg bg-slate-800 animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-slate-800 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 space-y-2">
              <div className="h-8 w-12 rounded-lg bg-slate-800 animate-pulse" />
              <div className="h-3 w-16 rounded-lg bg-slate-800 animate-pulse" />
            </div>
          ))}
        </div>
        <KanbanSkeleton />
      </div>
    </div>
  )
}
