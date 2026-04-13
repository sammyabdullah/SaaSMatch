/**
 * Server-side Supabase client.
 * Import this in Server Components, Server Actions, and Route Handlers.
 * Uses cookies() from next/headers to keep the session in sync.
 */
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll is called from Server Components where cookies are read-only.
            // The Middleware below handles refreshing the session cookie.
          }
        },
      },
    }
  )
}

/**
 * Admin client that bypasses RLS.
 * Uses the plain supabase-js client (NOT @supabase/ssr) so it never
 * inherits the user's session JWT from cookies. The service role key
 * is sent as the Authorization header on every request, which causes
 * PostgREST to skip RLS entirely.
 *
 * ONLY use in trusted server-side contexts (Server Components, Server
 * Actions, Route Handlers). Never import in client components.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
