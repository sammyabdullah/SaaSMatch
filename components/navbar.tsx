import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

export default async function Navbar() {
  let user = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase env vars missing or unreachable — show unauthenticated nav
  }

  return (
    <nav className="border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-[#534AB7] font-semibold text-base tracking-tight"
        >
          SaaSMatch
        </Link>

        <div className="flex items-center gap-5">
          {user ? (
            <>
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
