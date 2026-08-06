import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/nav/Sidebar'
import { MobileNav } from '@/components/nav/MobileNav'
import { type UserRow, type OrgRow } from '@/lib/database.types'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileData } = await supabase
    .from('users')
    .select('id, org_id, role, full_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  const profile = profileData as UserRow | null

  if (!profile) {
    redirect('/login')
  }

  const { data: orgData } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', profile.org_id)
    .single()

  const org = orgData as Pick<OrgRow, 'id' | 'name'> | null

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar profile={profile as UserRow} orgName={org?.name ?? 'Portal'} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <MobileNav profile={profile as UserRow} orgName={org?.name ?? 'Portal'} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
