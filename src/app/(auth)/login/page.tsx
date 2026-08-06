import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function LoginPage() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          Sign in to your client portal
        </p>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-slate-500">
        Need to create an agency account?{' '}
        <Link
          href="/signup"
          className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
