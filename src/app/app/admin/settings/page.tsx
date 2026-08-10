import { redirect } from 'next/navigation'
import { getCurrentProfile, getOrganizationDetails } from '@/lib/queries'
import { BrandingForm } from '@/components/admin/BrandingForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agency Branding Settings',
}

export default async function AdminSettingsPage() {
  const profile = await getCurrentProfile()

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/app/client')
  }

  const org = await getOrganizationDetails(profile.org_id)

  if (!org) {
    return (
      <div className="p-8 text-slate-400">
        Organization details could not be loaded.
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Agency Settings</h1>
          <p className="text-slate-400 text-sm mt-1">
            Customize white-label branding, agency logo, and accent colors for your client portal.
          </p>
        </div>

        <BrandingForm org={org} />
      </div>
    </div>
  )
}
