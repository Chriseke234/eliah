'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error Boundary Caught Error]:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-slate-950 text-white font-sans antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
            {error.message || 'An unhandled application error occurred. Please try reloading.'}
          </p>
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-lg shadow-violet-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
