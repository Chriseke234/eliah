'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[App Error Boundary Caught Error]:', error)
  }, [error])

  return (
    <div className="min-h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-white tracking-tight mb-2">
        Unable to load workspace
      </h2>
      <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
        {error.message || 'An unexpected error occurred while loading this page. Please try reloading or signing in again.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-lg shadow-violet-500/20"
        >
          <RefreshCw className="w-4 h-4" />
          Reload page
        </button>
        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Back to login
        </Link>
      </div>
    </div>
  )
}
