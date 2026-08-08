'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  LayoutDashboard,
  Kanban,
  Users,
  LogOut,
  ChevronDown,
  Bell,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { type UserRow } from '@/lib/database.types'
import { cn } from '@/lib/utils'

interface SidebarProps {
  profile: UserRow
  orgName: string
}

const clientNav = [
  { href: '/app/client', label: 'My Requests', icon: LayoutDashboard },
]

const adminNav = [
  { href: '/app/admin', label: 'Workspace', icon: Kanban },
  { href: '/app/admin/clients', label: 'Clients', icon: Users },
]

export function Sidebar({ profile, orgName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const navItems = profile?.role === 'ADMIN' ? adminNav : clientNav

  const handleSignOut = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    })
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : (profile?.email ?? 'US').slice(0, 2).toUpperCase()

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/60 bg-slate-950 shrink-0">
      {/* Logo / Org */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{orgName}</p>
          <p className="text-xs text-slate-400 truncate capitalize">{(profile?.role ?? 'CLIENT').toLowerCase()} portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/app/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Notifications hint */}
      <div className="px-3 pb-2">
        <Link
          href={profile.role === 'ADMIN' ? '/app/admin' : '/app/client'}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
        >
          <Bell className="w-4 h-4 text-slate-500" />
          Notifications
        </Link>
      </div>

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-slate-800/60 pt-3">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/60 transition-all group"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-slate-200 truncate">{profile.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{profile.email}</p>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-500 flex-shrink-0 transition-transform',
                userMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {userMenuOpen && (
            <div
              className="absolute bottom-full left-0 right-0 mb-1 bg-slate-900 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden"
              role="menu"
            >
              <button
                onClick={handleSignOut}
                disabled={isPending}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                role="menuitem"
              >
                <LogOut className="w-4 h-4" />
                {isPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
