'use client'

import { useState, useMemo } from 'react'
import { type UserRow } from '@/lib/database.types'
import { formatDate } from '@/lib/utils'
import { Mail, Calendar, Search, Filter, ExternalLink } from 'lucide-react'
import { ClientDetailDrawer } from './ClientDetailDrawer'

interface ClientTableProps {
  clients: UserRow[]
}

export function ClientTable({ clients }: ClientTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [selectedClient, setSelectedClient] = useState<UserRow | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const name = (c.full_name || '').toLowerCase()
      const email = (c.email || '').toLowerCase()
      const query = searchQuery.toLowerCase().trim()

      const matchesQuery = !query || name.includes(query) || email.includes(query)
      const matchesRole = roleFilter === 'ALL' || c.role === roleFilter

      return matchesQuery && matchesRole
    })
  }, [clients, searchQuery, roleFilter])

  const openClientDetail = (client: UserRow) => {
    setSelectedClient(client)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Search & Role Filter Bar */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-violet-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Roles</option>
              <option value="CLIENT" className="bg-slate-900 text-white">Clients Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
        {/* Mobile: card list */}
        <div className="sm:hidden divide-y divide-slate-800/60">
          {filteredClients.map((client) => {
            const initials = client.full_name
              ? client.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
              : client.email.slice(0, 2).toUpperCase()

            return (
              <div
                key={client.id}
                onClick={() => openClientDetail(client)}
                className="flex items-center gap-4 p-4 hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 border border-violet-500/20">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{client.full_name || '—'}</p>
                  <p className="text-xs text-slate-500 truncate">{client.email}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Joined {formatDate(client.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop: table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full" role="table" aria-label="Client list">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/40">
                {['Client Name', 'Email Address', 'Role', 'Joined Date', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3.5 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredClients.map((client) => {
                const initials = client.full_name
                  ? client.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                  : client.email.slice(0, 2).toUpperCase()

                return (
                  <tr
                    key={client.id}
                    onClick={() => openClientDetail(client)}
                    className="group hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 border border-violet-500/20">
                          {initials}
                        </div>
                        <span className="text-sm font-medium text-slate-200 group-hover:text-violet-300 transition-colors">
                          {client.full_name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-sm text-slate-400">{client.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        Client
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-sm text-slate-400">{formatDate(client.created_at)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
                        View History <ExternalLink className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail Drawer */}
      <ClientDetailDrawer
        client={selectedClient}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
