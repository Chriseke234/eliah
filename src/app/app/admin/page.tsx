import { redirect } from 'next/navigation'
import { getCurrentProfile, getAdminRequests } from '@/lib/queries'
import { KanbanBoard } from '@/components/admin/KanbanBoard'
import { EmptyState } from '@/components/ui/empty-state'
import { LayoutDashboard } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Workspace',
}

export default async function AdminWorkspacePage() {
  const profile = await getCurrentProfile()

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/app/client')
  }

  const typedRequests = await getAdminRequests(profile.org_id)

  const stats = {
    total: typedRequests.length,
    todo: typedRequests.filter((r) => r.status === 'TODO').length,
    inProgress: typedRequests.filter((r) => r.status === 'IN_PROGRESS').length,
    completed: typedRequests.filter((r) => r.status === 'COMPLETED').length,
  }

  return (
    <div className="min-h-full bg-slate-950">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Workspace</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage all client requests across your organization
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'To Do', value: stats.todo, color: 'text-slate-300' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-amber-300' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-300' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800/60 rounded-xl p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Kanban board */}
        {typedRequests.length === 0 ? (
          <EmptyState
            icon={LayoutDashboard}
            title="No requests yet"
            description="Client requests will appear here as a kanban board once submitted."
          />
        ) : (
          <KanbanBoard initialRequests={typedRequests} />
        )}
      </div>
    </div>
  )
}
