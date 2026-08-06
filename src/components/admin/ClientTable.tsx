'use client'

import { type UserRow } from '@/lib/database.types'
import { formatDate } from '@/lib/utils'
import { Mail, Calendar, MoreHorizontal } from 'lucide-react'

interface ClientTableProps {
  clients: UserRow[]
}

export function ClientTable({ clients }: ClientTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-xl overflow-hidden">
      {/* Mobile: card list */}
      <div className="sm:hidden divide-y divide-slate-800/60">
        {clients.map((client) => {
          const initials = client.full_name
            ? client.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
            : client.email.slice(0, 2).toUpperCase()

          return (
            <div key={client.id} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
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
            <tr className="border-b border-slate-800/60">
              {['Client', 'Email', 'Role', 'Joined'].map((h) => (
                <th
                  key={h}
                  className="text-left py-4 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {clients.map((client) => {
              const initials = client.full_name
                ? client.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                : client.email.slice(0, 2).toUpperCase()

              return (
                <tr key={client.id} className="group hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {initials}
                      </div>
                      <span className="text-sm font-medium text-slate-200">
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
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      Client
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-sm text-slate-500">{formatDate(client.created_at)}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
