import { RequestListSkeleton } from '@/components/ui/loading-skeleton'

export default function ClientLoading() {
  return (
    <div className="min-h-full bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-8 w-40 rounded-lg bg-slate-800 animate-pulse" />
            <div className="h-4 w-56 rounded-lg bg-slate-800 animate-pulse" />
          </div>
          <div className="h-10 w-36 rounded-lg bg-slate-800 animate-pulse" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 space-y-2">
              <div className="h-8 w-12 rounded-lg bg-slate-800 animate-pulse" />
              <div className="h-3 w-24 rounded-lg bg-slate-800 animate-pulse" />
            </div>
          ))}
        </div>
        <RequestListSkeleton />
      </div>
    </div>
  )
}
