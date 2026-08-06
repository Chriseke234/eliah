import { TableRowSkeleton } from '@/components/ui/loading-skeleton'

export default function ClientsLoading() {
  return (
    <div className="min-h-full bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-8 w-24 rounded-lg bg-slate-800 animate-pulse" />
            <div className="h-4 w-48 rounded-lg bg-slate-800 animate-pulse" />
          </div>
          <div className="h-10 w-32 rounded-lg bg-slate-800 animate-pulse" />
        </div>
        <div className="bg-slate-900 border border-slate-800/60 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/60">
                {['Name', 'Email', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-4 px-4">
                    <div className="h-3 w-16 rounded bg-slate-800 animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
