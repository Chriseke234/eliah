'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  LayoutDashboard,
  Kanban,
  Users,
  LogOut,
  Menu,
  X,
  Settings,
  Building2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { type UserRow, type OrgRow } from '@/lib/database.types'
import { cn } from '@/lib/utils'
import { NotificationBell } from './NotificationBell'

interface MobileNavProps {
  profile: UserRow
  org: OrgRow | null
}

const clientNav = [
  { href: '/app/client', label: 'My Requests', icon: LayoutDashboard },
]

const adminNav = [
  { href: '/app/admin', label: 'Workspace', icon: Kanban },
  { href: '/app/admin/clients', label: 'Clients', icon: Users },
  { href: '/app/admin/settings', label: 'Agency Branding', icon: Settings },
]

export function MobileNav({ profile, org }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const navItems = profile?.role === 'ADMIN' ? adminNav : clientNav

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (profile?.email ?? 'US').slice(0, 2).toUpperCase()

  const orgName = org?.name ?? 'Agency Portal'

  const handleSignOut = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <>
      {/* Top bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-slate-950 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          {org?.logo_url ? (
            <img
              src={org.logo_url}
              alt={orgName}
              className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          <span className="text-sm font-semibold text-white">{orgName}</span>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800/60 flex flex-col transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            {org?.logo_url ? (
              <img
                src={org.logo_url}
                alt={orgName}
                className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <span className="text-sm font-semibold text-white">{orgName}</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/app/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-violet-400' : 'text-slate-500')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 pb-6 border-t border-slate-800/60 pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{profile.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isPending}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {isPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </>
  )
}
