import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (code || token_hash) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    let authError = null

    if (code) {
      // PKCE flow: exchange the short-lived authorization code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      authError = error
    } else if (token_hash && type) {
      // Token-hash flow: verify the OTP hash directly (no stored verifier needed,
      // works reliably across browsers and email clients)
      const { error } = await supabase.auth.verifyOtp({ token_hash, type })
      authError = error
    }

    if (!authError) {
      if (type === 'recovery') {
        // Keep the session so the user can set a new password
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      // Email confirmation — sign out and show confirmed page
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/auth/confirmed?verified=1`)
    }
  }

  // Auth failed or no token present — redirect with context so the user
  // sees a helpful message rather than silently landing on the login page
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/forgot-password?error=link_expired`)
  }
  return NextResponse.redirect(`${origin}/login`)
}
