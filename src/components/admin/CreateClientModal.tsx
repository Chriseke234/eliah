'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClientAccount } from '@/app/actions/auth'
import { X, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, UserPlus } from 'lucide-react'

interface CreateClientModalProps {
  open: boolean
  onClose: () => void
}

export function CreateClientModal({ open, onClose }: CreateClientModalProps) {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', fullName: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    startTransition(async () => {
      const result = await createClientAccount({
        email: form.email,
        fullName: form.fullName,
        password: form.password,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)
      router.refresh()
      setTimeout(() => {
        setForm({ email: '', fullName: '', password: '' })
        setSuccess(false)
        onClose()
      }, 1500)
    })
  }

  const handleClose = () => {
    if (isPending) return
    setForm({ email: '', fullName: '', password: '' })
    setError(null)
    setSuccess(false)
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-client-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-slate-900 border border-slate-800/60 rounded-t-2xl sm:rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-violet-400" />
            <h2 id="create-client-title" className="text-base font-semibold text-white">
              Add New Client
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <label htmlFor="client-name" className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <input
                id="client-name"
                type="text"
                required
                value={form.fullName}
                onChange={update('fullName')}
                placeholder="Jane Smith"
                disabled={isPending}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700/60 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="client-email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <input
                id="client-email"
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                placeholder="jane@company.com"
                disabled={isPending}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700/60 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              />
            </div>

            {/* Temporary password */}
            <div className="space-y-1.5">
              <label htmlFor="client-password" className="block text-sm font-medium text-slate-300">
                Temporary Password
              </label>
              <div className="relative">
                <input
                  id="client-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="Min. 8 characters"
                  disabled={isPending}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-slate-800 border border-slate-700/60 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-600">
                Share this password with the client to access the portal
              </p>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div role="status" className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Client account created successfully!
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-800/60 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !form.email || !form.fullName || !form.password || success}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
              ) : (
                'Create Client'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
