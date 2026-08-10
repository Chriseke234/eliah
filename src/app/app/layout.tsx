import { redirect } from 'next/navigation'
import { getCurrentProfile, getOrganizationDetails } from '@/lib/queries'
import { Sidebar } from '@/components/nav/Sidebar'
import { MobileNav } from '@/components/nav/MobileNav'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  const org = await getOrganizationDetails(profile.org_id)

  return (
    <ThemeProvider primaryColor={org?.primary_color} secondaryColor={org?.secondary_color}>
      <div className="flex h-screen bg-slate-950 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar profile={profile} org={org} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile top bar */}
          <MobileNav profile={profile} org={org} />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
