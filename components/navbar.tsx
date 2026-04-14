import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

export default async function Navbar() {
  let user = null
  let role: string | null = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      role = profile?.role ?? null
    }
  } catch {
    // Supabase env vars missing or unreachable — show unauthenticated nav
  }

  return (
    <nav className="border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-[#534AB7] font-black text-xl tracking-widest uppercase"
        >
          UnlockedVC
        </Link>

        <div className="flex items-center gap-5">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/discover"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Discover
              </Link>
              <Link
                href="/account"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Account
              </Link>
              {role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Admin
                </Link>
              )}
              <span className="text-sm text-gray-400 hidden sm:block">
                {user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm px-4 py-1.5 bg-[#534AB7] text-white rounded-md hover:bg-[#4339A0] transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
