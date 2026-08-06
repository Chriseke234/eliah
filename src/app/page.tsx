import { redirect } from 'next/navigation'

/**
 * Root page — just redirects to /login.
 * The middleware handles already-authenticated users and redirects them to their dashboard.
 */
export default function RootPage() {
  redirect('/login')
}
