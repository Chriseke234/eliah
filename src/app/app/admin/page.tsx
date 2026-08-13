import { redirect } from 'next/navigation'
import { getCurrentProfile, getAdminRequests } from '@/lib/queries'
import { AdminWorkspaceView } from '@/components/admin/AdminWorkspaceView'
import { EmptyState } from '@/components/ui/empty-state'
import { LayoutDashboard, CheckCircle2, Clock, PlayCircle, Layers } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Workspace — Agency Dashboard',
}

export default async function AdminWorkspacePage() {
  const profile = await getCurrentProfile()

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/app/client')
  }

  const typedRequests = await getAdminRequests(profile.org_id)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const stats = {
    total: typedRequests.length,
    todo: typedRequests.filter((r) => r.status === 'TODO').length,
    inProgress: typedRequests.filter((r) => r.status === 'IN_PROGRESS').length,
    completed: typedRequests.filter((r) => r.status === 'COMPLETED').length,
    totalThisWeek: typedRequests.filter((r) => new Date(r.created_at) >= sevenDaysAgo).length,
    completedThisWeek: typedRequests.filter(
      (r) => r.status === 'COMPLETED' && new Date(r.updated_at || r.created_at) >= sevenDaysAgo
    ).length,
  }

  return (
    <div className="min-h-full bg-slate-950">
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5" /> Agency Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Client Request Workspace
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Track deliverables, assign priorities, and manage external client payment links.
            </p>
          </div>
        </div>

        {/* Glassmorphic Stats Grid with Trend Badges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Requests */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Requests</p>
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <LayoutDashboard className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <p className="text-3xl font-extrabold text-white tracking-tight">{stats.total}</p>
              {stats.totalThisWeek > 0 && (
                <span className="text-[11px] font-semibold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                  +{stats.totalThisWeek} this week
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Active client deliverables</p>
          </div>

          {/* To Do */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">To Do</p>
              <div className="p-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700/60">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-200 mt-3 tracking-tight">{stats.todo}</p>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting queue start</p>
          </div>

          {/* In Progress */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider">In Progress</p>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <PlayCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-amber-300 mt-3 tracking-tight">{stats.inProgress}</p>
            <p className="text-[11px] text-amber-400/60 mt-1">Active in execution</p>
          </div>

          {/* Completed */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-emerald-400/90 uppercase tracking-wider">Completed</p>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <p className="text-3xl font-extrabold text-emerald-300 tracking-tight">{stats.completed}</p>
              {stats.completedThisWeek > 0 && (
                <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  +{stats.completedThisWeek} this week
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-400/60 mt-1">Delivered to client</p>
          </div>
        </div>

        {/* Admin Workspace View (Kanban + Table + Search Toolbar) */}
        {typedRequests.length === 0 ? (
          <EmptyState
            icon={LayoutDashboard}
            title="No client requests yet"
            description="Requests submitted by clients will automatically populate your Kanban board and interactive table."
          />
        ) : (
          <AdminWorkspaceView initialRequests={typedRequests} />
        )}
      </div>
    </div>
  )
}
