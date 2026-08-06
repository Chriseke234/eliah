import type { Metadata } from 'next'
import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Create Agency Account',
}

export default function SignupPage() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Create your agency
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          Set up your workspace and start managing clients
        </p>
      </div>

      <SignupForm />

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
