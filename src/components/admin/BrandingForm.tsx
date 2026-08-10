'use client'

import { useState, useTransition } from 'react'
import { updateOrganizationBranding } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { type OrgRow } from '@/lib/database.types'
import { Check, Loader2, Sparkles, Building2, Image as ImageIcon, Palette } from 'lucide-react'

interface BrandingFormProps {
  org: OrgRow
}

export function BrandingForm({ org }: BrandingFormProps) {
  const [name, setName] = useState(org.name)
  const [logoUrl, setLogoUrl] = useState(org.logo_url ?? '')
  const [primaryColor, setPrimaryColor] = useState(org.primary_color ?? '#8b5cf6')
  const [secondaryColor, setSecondaryColor] = useState(org.secondary_color ?? '#6366f1')

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!name.trim()) {
      setError('Agency name is required')
      return
    }

    startTransition(async () => {
      const res = await updateOrganizationBranding({
        name: name.trim(),
        logoUrl: logoUrl.trim() || undefined,
        primaryColor,
        secondaryColor,
      })

      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-slate-900 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          Branding settings updated successfully!
        </div>
      )}

      {/* Agency Name */}
      <div className="space-y-2">
        <label htmlFor="agency-name" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-violet-400" />
          Agency / Brand Name
        </label>
        <input
          id="agency-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Creative Agency"
          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          required
        />
        <p className="text-xs text-slate-500">This name will appear on client portals and automated notifications.</p>
      </div>

      {/* Logo URL */}
      <div className="space-y-2">
        <label htmlFor="logo-url" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-violet-400" />
          Logo URL
        </label>
        <input
          id="logo-url"
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        />
        <p className="text-xs text-slate-500">Direct image link for your agency logo (PNG, SVG, or WEBP recommended).</p>
      </div>

      {/* Brand Accent Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <label htmlFor="primary-color" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4 text-violet-400" />
            Primary Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="primary-color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 uppercase"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="secondary-color" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Secondary Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="secondary-color"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
            />
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 uppercase"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save White-Label Branding'
          )}
        </Button>
      </div>
    </form>
  )
}
