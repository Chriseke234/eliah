'use client'

import { useState, useTransition } from 'react'
import { updateOrganizationBranding } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { type OrgRow } from '@/lib/database.types'
import { Check, Loader2, Sparkles, Building2, Image as ImageIcon, Palette, Eye, Plus, LayoutDashboard, Clock, Globe, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface BrandingFormProps {
  org: OrgRow
}

export function BrandingForm({ org }: BrandingFormProps) {
  const [name, setName] = useState(org.name)
  const [logoUrl, setLogoUrl] = useState(org.logo_url ?? '')
  const [primaryColor, setPrimaryColor] = useState(org.primary_color ?? '#8b5cf6')
  const [secondaryColor, setSecondaryColor] = useState(org.secondary_color ?? '#6366f1')
  const [customDomain, setCustomDomain] = useState(org.custom_domain ?? '')

  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const filePath = `branding/logo-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('request-attachments')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data: publicUrlData } = supabase.storage
        .from('request-attachments')
        .getPublicUrl(filePath)

      if (publicUrlData?.publicUrl) {
        setLogoUrl(publicUrlData.publicUrl)
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to upload logo image')
    } finally {
      setIsUploading(false)
    }
  }

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
        customDomain: customDomain.trim() || undefined,
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
          <p className="text-xs text-slate-400 mt-1">Configure your brand identity and custom domain for client-facing portals.</p>
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

        {/* Custom Domain & Subdomain Mapping */}
        <div className="space-y-2">
          <label htmlFor="custom-domain" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-violet-400" />
            Custom Domain / Subdomain Mapping
          </label>
          <input
            id="custom-domain"
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="portal.youragency.com"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5 text-xs text-slate-400">
            <p className="font-medium text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-violet-400" /> DNS CNAME Target:
            </p>
            <p className="font-mono text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800/80">
              CNAME {customDomain.trim() || 'portal.youragency.com'} &rarr; app.eliahportal.com
            </p>
          </div>
        </div>

        {/* Logo Upload & Image URL */}
        <div className="space-y-3">
          <label htmlFor="logo-url" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-violet-400" />
            Agency Logo Image
          </label>

          {/* Drag and Drop File Upload Control */}
          <div className="relative border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-2xl p-5 bg-slate-950/60 transition-colors text-center cursor-pointer group">
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="space-y-2 flex flex-col items-center">
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-slate-500 group-hover:text-violet-400 transition-colors" />
              )}
              <p className="text-xs font-medium text-slate-300">
                {isUploading ? 'Uploading logo image...' : 'Click or drop logo image here'}
              </p>
              <p className="text-[11px] text-slate-500">Uploads to Supabase Storage (PNG, SVG, WEBP, JPEG)</p>
            </div>
          </div>

          {/* URL Fallback Input */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Or paste direct image URL fallback:</span>
            <input
              id="logo-url"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
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
              <p className="text-[11px] text-slate-500 truncate">
                {customDomain.trim() ? customDomain.trim() : 'Client Portal'}
              </p>
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
