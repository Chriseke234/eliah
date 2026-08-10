import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'
import { ClientTable } from '@/components/admin/ClientTable'
import { CreateClientButton } from '@/components/admin/CreateClientButton'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'
import { type UserRow } from '@/lib/database.types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Client Management',
}

export default async function ClientsPage() {
  const profile = await getCurrentProfile()

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/app/client')
  }

  const supabase = await createClient()
  const { data: clients, error } = await supabase
    .from('users')
    .select('*')
    .eq('org_id', profile.org_id)
    .eq('role', 'CLIENT')
    .order('created_at', { ascending: false })

  if (error) console.error('[ClientsPage]', error)

  const typedClients = (clients ?? []) as UserRow[]

  return (
    <div className="min-h-full bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Clients</h1>
            <p className="text-slate-400 text-sm mt-1">
              {typedClients.length} client{typedClients.length !== 1 ? 's' : ''} in your organization
            </p>
          </div>
          <CreateClientButton />
        </div>

        {typedClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first client to get started. They will be able to submit and track requests."
            action={<CreateClientButton />}
          />
        ) : (
          <ClientTable clients={typedClients} />
        )}
      </div>
    </div>
  )
}
