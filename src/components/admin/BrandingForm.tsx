'use client'

import { useState, useTransition } from 'react'
import { updateOrganizationBranding } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { type OrgRow } from '@/lib/database.types'
import { Check, Loader2, Sparkles, Building2, Image as ImageIcon, Palette, Eye, Plus, LayoutDashboard, Clock } from 'lucide-react'

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Form inputs */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6 bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-semibold text-white">White-Label Customization</h2>
          <p className="text-xs text-slate-400 mt-1">Configure your brand identity across all client-facing portals.</p>
        </div>

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
        </div>

        {/* Logo URL */}
        <div className="space-y-2">
          <label htmlFor="logo-url" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-violet-400" />
            Logo Image URL
          </label>
          <input
            id="logo-url"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
          <p className="text-xs text-slate-500">Direct PNG, SVG, or WEBP image link for your agency logo.</p>
        </div>

        {/* Brand Accent Colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="primary-color" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-violet-400" />
              Primary Accent
            </label>
            <div className="flex items-center gap-3">
              <input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 uppercase font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="secondary-color" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Secondary Accent
            </label>
            <div className="flex items-center gap-3">
              <input
                id="secondary-color"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 uppercase font-mono"
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

      {/* Live Portal Previewer */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          <Eye className="w-4 h-4 text-violet-400" /> Live Client Portal Preview
        </div>

        <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-5 space-y-5 shadow-2xl overflow-hidden relative">
          {/* Simulated Sidebar Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
            {logoUrl.trim() ? (
              <img
                src={logoUrl.trim()}
                alt="Agency Logo"
                className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-slate-700/50"
                onError={(e) => {
                  // Fallback if image breaks
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                }}
              >
                <Building2 className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{name.trim() || 'Agency Name'}</p>
              <p className="text-[11px] text-slate-500">Client Portal</p>
            </div>
          </div>

          {/* Simulated Action Button */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium">Custom Accent Button</p>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold shadow-lg transition-transform hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                boxShadow: `0 4px 14px 0 ${primaryColor}40`,
              }}
            >
              <Plus className="w-4 h-4" /> New Project Request
            </button>
          </div>

          {/* Simulated Request Card */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium">Client Card Accent</p>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Brand Refresh Assets</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    borderColor: `${primaryColor}40`,
                    color: primaryColor,
                  }}
                >
                  In Progress
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Brand guidelines, vector logos, and visual design assets.
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" /> 2 days ago
                </span>
                <span className="text-emerald-400 font-medium">Pay Now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
