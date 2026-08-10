import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: {
    default: 'Eliah Portal',
    template: '%s | Eliah Portal',
  },
  description: 'Productized agency client portal — manage requests, track progress, and collaborate with your team.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn('font-sans', plusJakartaSans.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100">
        {children}
      </body>
    </html>
  )
}
