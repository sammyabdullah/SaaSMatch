import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://founderinvited.com'
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  // For password recovery: pass the token to the client page where hCaptcha
  // can be completed before verifyOtp is called (Attack Protection requires it)
  if (type === 'recovery' && (code || token_hash)) {
    const params = new URLSearchParams()
    if (token_hash) params.set('token_hash', token_hash)
    if (code) params.set('code', code)
    return NextResponse.redirect(`${origin}/auth/reset-redirect?${params.toString()}`)
  }

  if (code || token_hash) {
    // Use the admin client for server-side token verification so Supabase
    // Attack Protection (hCaptcha) doesn't block the callback — the user
    // clicking the email link is already their proof of identity here.
    const admin = createAdminClient()

    if (token_hash && type) {
      const { error } = await admin.auth.verifyOtp({ token_hash, type })
      if (!error) {
        return NextResponse.redirect(`${origin}/auth/confirmed?verified=1`)
      }
    } else if (code) {
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
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/auth/confirmed?verified=1`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
