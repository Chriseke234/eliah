'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signUpWithOrg } from '@/app/actions/auth'
import { Eye, EyeOff, Loader2, Building2 } from 'lucide-react'

export function SignupForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    orgName: '',
    fullName: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    startTransition(async () => {
      const result = await signUpWithOrg({
        orgName: form.orgName,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      router.push('/app/admin')
      router.refresh()
    })
  }

  const fields: Array<{
    id: keyof typeof form
    label: string
    type: string
    placeholder: string
    autoComplete: string
  }> = [
    { id: 'orgName', label: 'Agency name', type: 'text', placeholder: 'Acme Studio', autoComplete: 'organization' },
    { id: 'fullName', label: 'Your full name', type: 'text', placeholder: 'Jane Doe', autoComplete: 'name' },
    { id: 'email', label: 'Email address', type: 'email', placeholder: 'jane@company.com', autoComplete: 'email' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {fields.map((f) => (
        <div key={f.id} className="space-y-1.5">
          <label htmlFor={f.id} className="block text-sm font-medium text-slate-300">
            {f.label}
          </label>
          <input
            id={f.id}
            type={f.type}
            required
            autoComplete={f.autoComplete}
            value={form[f.id]}
            onChange={update(f.id)}
            placeholder={f.placeholder}
            disabled={isPending}
            className="w-full px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          />
        </div>
      ))}

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            placeholder="Min. 8 characters"
            disabled={isPending}
            className="w-full px-4 py-2.5 pr-10 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
        >
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || !form.orgName || !form.fullName || !form.email || !form.password}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Building2 className="w-4 h-4" />
        )}
        {isPending ? 'Creating workspace…' : 'Create agency account'}
      </button>

      <p className="text-xs text-slate-500 text-center">
        By signing up you agree to our Terms of Service
      </p>
    </form>
  )
}
