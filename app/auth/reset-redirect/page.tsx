'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ResetRedirectContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const token_hash = searchParams.get('token_hash')
  const code = searchParams.get('code')

  const hasToken = !!(token_hash || code)

  async function handleClick() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    let authError = null
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      authError = error
    } else if (token_hash) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'recovery' })
      authError = error
    }

    if (authError) {
      setError('This link has expired or has already been used.')
      setLoading(false)
    } else {
      router.push('/reset-password')
    }
  }

  if (!hasToken) {
    return (
      <div className="max-w-md mx-auto px-6 py-24">
        <p className="text-sm text-gray-500">
          Invalid reset link.{' '}
          <a href="/forgot-password" className="text-[#534AB7] hover:underline">
            Request a new one
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Reset your password</h1>
        <p className="text-sm text-gray-500 mt-2">
          Click the button below to set a new password for your account.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-sm text-amber-800">{error}</p>
          <p className="text-sm text-amber-700 mt-1">
            <a href="/forgot-password" className="underline underline-offset-2">
              Request a new reset link
            </a>
          </p>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={loading}
          className="w-full bg-[#534AB7] text-white py-2 rounded-md text-sm font-medium hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying…' : 'Set my new password →'}
        </button>
      )}
    </div>
  )
}

export default function ResetRedirectPage() {
  return (
    <Suspense>
      <ResetRedirectContent />
    </Suspense>
  )
}
