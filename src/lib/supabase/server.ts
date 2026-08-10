import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
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

export async function createClient() {
  const cookieStore = await cookies()

  const url = getValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY! Please set it in your .env.local or Vercel Project Settings.'
    )
  }

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookie setting is a no-op in RSC
          }
        },
      },
    }
  )
}

/**
 * Creates an admin Supabase client using the service role key.
 * Use ONLY in server actions that need to bypass RLS (e.g., creating users).
 * Does not bind to user request cookies to avoid session pollution.
 */
export async function createAdminClient() {
  const url = getValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY! Please set it in your .env.local or Vercel Project Settings.'
    )
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
