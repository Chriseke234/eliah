import { redirect } from 'next/navigation'
import { getCurrentProfile, getClientRequests } from '@/lib/queries'
import { RequestList } from '@/components/client/RequestList'
import { NewRequestButton } from '@/components/client/NewRequestButton'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Requests',
}

export default async function ClientDashboardPage() {
  const profile = await getCurrentProfile()

  if (!profile) redirect('/login')

  const typedRequests = await getClientRequests(profile.id)

  const stats = {
    total: typedRequests.length,
    inProgress: typedRequests.filter((r) => r.status === 'IN_PROGRESS').length,
    completed: typedRequests.filter((r) => r.status === 'COMPLETED').length,
    pendingPayment: typedRequests.filter((r) => r.payment_link && r.status !== 'COMPLETED').length,
  }

  return (
    <div className="min-h-full bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Requests</h1>
            <p className="text-slate-400 text-sm mt-1">
              Track and manage your project requests
            </p>
          </div>
          <NewRequestButton userId={profile.id} />
        </div>

        {/* Stats row */}
        {typedRequests.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Total Requests', value: stats.total, color: 'text-white' },
              { label: 'In Progress', value: stats.inProgress, color: 'text-amber-300' },
              { label: 'Completed', value: stats.completed, color: 'text-emerald-300' },
              { label: 'Awaiting Payment', value: stats.pendingPayment, color: 'text-violet-300' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-slate-900 border border-slate-800/60 rounded-xl p-4"
              >
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Requests list */}
        {typedRequests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No requests yet"
            description="Submit your first request and our team will get started right away."
            action={<NewRequestButton userId={profile.id} />}
          />
        ) : (
          <RequestList requests={typedRequests} />
        )}
      </div>
    </div>
  )
}
