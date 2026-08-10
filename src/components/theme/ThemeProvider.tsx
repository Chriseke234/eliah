'use client'

import { useEffect } from 'react'

interface ThemeProviderProps {
  primaryColor?: string | null
  secondaryColor?: string | null
  children: React.ReactNode
}

export function ThemeProvider({
  primaryColor = '#8b5cf6',
  secondaryColor = '#6366f1',
  children,
}: ThemeProviderProps) {
  const primary = primaryColor?.trim() || '#8b5cf6'
  const secondary = secondaryColor?.trim() || '#6366f1'

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--brand-primary', primary)
    root.style.setProperty('--brand-secondary', secondary)
  }, [primary, secondary])

  return <>{children}</>
}
