import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/lib/database.types'

function getValidUrl(urlRaw?: string): string {
  const url = urlRaw?.trim()
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${urlRaw}". It must be a valid HTTP or HTTPS URL (e.g., https://your-project.supabase.co). Please check your .env.local file or environment variables.`
    )
  }
  return url
}

export function createClient() {
  const url = getValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY! Please set it in your .env.local or Vercel Project Settings.'
    )
  }

  return createBrowserClient<Database>(url, key)
}
