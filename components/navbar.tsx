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
          className="font-black text-2xl tracking-widest uppercase flex items-center gap-1.5"
        >
          <span style={{ color: '#000000' }}>Unlocked</span><span style={{ color: '#29ABE2' }}>VC</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            width="22"
            height="22"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path d="M51,58 Q50,75 49,96" stroke="#999" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M50,73 Q41,67 31,57" stroke="#999" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M50,80 Q57,73 62,63" stroke="#999" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M47,39 Q34,24 20,10" stroke="#7DC8E8" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <path d="M49,37 Q47,22 46,6" stroke="#7DC8E8" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M52,38 Q60,22 67,6" stroke="#7DC8E8" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M55,41 Q71,37 90,36" stroke="#7DC8E8" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <path d="M54,47 Q67,53 83,57" stroke="#7DC8E8" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <path d="M46,47 Q34,54 17,57" stroke="#7DC8E8" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <path d="M45,42 Q29,39 10,37" stroke="#7DC8E8" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <line x1="48" y1="38" x2="38" y2="18" stroke="#7DC8E8" strokeWidth="1.5"/>
            <line x1="36" y1="17" x2="40" y2="19" stroke="#7DC8E8" strokeWidth="1.5"/>
            <line x1="53" y1="38" x2="72" y2="24" stroke="#7DC8E8" strokeWidth="1.5"/>
            <line x1="70" y1="23" x2="74" y2="26" stroke="#7DC8E8" strokeWidth="1.5"/>
            <line x1="55" y1="42" x2="78" y2="42" stroke="#7DC8E8" strokeWidth="1.5"/>
            <line x1="77" y1="40" x2="79" y2="44" stroke="#7DC8E8" strokeWidth="1.5"/>
            <circle cx="50" cy="43" r="9" fill="#7DC8E8"/>
            <circle cx="50" cy="43" r="6.5" fill="#9ED8F0"/>
          </svg>
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
