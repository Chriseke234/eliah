'use client'

import { useState, useMemo } from 'react'
import { type RequestWithClient, type RequestStatus } from '@/lib/database.types'
import { KanbanBoard } from './KanbanBoard'
import { AdminTableView } from './AdminTableView'
import { RequestDrawer } from './RequestDrawer'
import { updateRequest } from '@/app/actions/requests'
import { Search, LayoutGrid, TableProperties, Filter, Sparkles, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface AdminWorkspaceViewProps {
  initialRequests: RequestWithClient[]
}

export function AdminWorkspaceView({ initialRequests }: AdminWorkspaceViewProps) {
  const [requests, setRequests] = useState<RequestWithClient[]>(initialRequests)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')

  const [selectedRequest, setSelectedRequest] = useState<RequestWithClient | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Filter requests based on search query, priority, and status filter
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const clientName = (r.users?.full_name || r.users?.email || '').toLowerCase()
      const title = (r.title || '').toLowerCase()
      const desc = (r.description || '').toLowerCase()
      const query = searchQuery.toLowerCase().trim()

      const matchesQuery = !query || title.includes(query) || desc.includes(query) || clientName.includes(query)
      const matchesPriority = priorityFilter === 'ALL' || (r.priority || 'MEDIUM').toUpperCase() === priorityFilter
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter

      return matchesQuery && matchesPriority && matchesStatus
    })
  }, [requests, searchQuery, priorityFilter, statusFilter])

  const handleStatusChange = async (requestId: string, newStatus: RequestStatus) => {
    // Optimistic update
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
    )

    const { error } = await updateRequest(requestId, { status: newStatus })
    if (error) {
      console.error('[AdminWorkspaceView] status update failed:', error)
    }
  }

  const handleRequestUpdate = (updated: Partial<RequestWithClient> & { id: string }) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
    )
    if (selectedRequest?.id === updated.id) {
      setSelectedRequest((prev) => (prev ? { ...prev, ...updated } : prev))
    }
  }

  const openDrawer = (req: RequestWithClient) => {
    setSelectedRequest(req)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Interactive Toolbar */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Left: Search Bar & Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, description, or client..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-violet-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Priorities</option>
              <option value="HIGH" className="bg-slate-900 text-white">High Priority</option>
              <option value="MEDIUM" className="bg-slate-900 text-white">Medium Priority</option>
              <option value="LOW" className="bg-slate-900 text-white">Low Priority</option>
            </select>
          </div>

          {/* Status Pills */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['ALL', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Right: View Switcher (Kanban vs Table) */}
        <div className="flex items-center justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">View Mode:</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label="Switch to Kanban View"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label="Switch to Table View"
            >
              <TableProperties className="w-3.5 h-3.5" /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          initialRequests={filteredRequests}
          onOpenDrawer={openDrawer}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <AdminTableView
          requests={filteredRequests}
          onOpenDrawer={openDrawer}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Shared Drawer */}
      <RequestDrawer
        request={selectedRequest}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={handleRequestUpdate}
      />
    </div>
  )
}
