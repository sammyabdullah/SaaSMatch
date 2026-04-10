'use client'

import { signOut } from '@/app/actions/auth'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
    >
      Sign out
    </button>
  )
}
