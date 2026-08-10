import type { Metadata } from 'next'
import { Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Authentication — Agency Portal',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-slate-950 text-white relative overflow-hidden">
      {/* Left side form area */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-12 z-10 max-w-xl mx-auto w-full">
        {/* Brand logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight">
              Agency Platform
            </span>
            <span className="block text-xs text-slate-400">Custom Client Operations</span>
          </div>
        </div>

        {/* Card wrapper */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {children}
        </div>
      </div>

      {/* Right side hero background preview for desktop */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
          alt="Creative Agency Workspace"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />

        <div className="relative z-10 self-end p-12 space-y-4 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold uppercase tracking-wider">
            Custom Agency Software
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
            Streamline client requests and deliverables under your agency brand.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Provide clients with a branded portal for requests, attachments, external payment links, and real-time status updates.
          </p>
        </div>
      </div>
    </div>
  )
}
