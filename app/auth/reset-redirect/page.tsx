'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ResetRedirectContent() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'form' | 'done' | 'error'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const token_hash = searchParams.get('token_hash')
  const code = searchParams.get('code')
  const hasToken = !!(token_hash || code)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password.length > 72) { setError('Password must be 72 characters or fewer.'); return }

    setError('')
    setLoading(true)
    const supabase = createClient()

    // Step 1: verify the token to establish a recovery session
    let authError = null
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      authError = error
    } else if (token_hash) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'recovery' })
      authError = error
    }

    if (authError) {
      setError('This password reset link has expired or was already used.')
      setLoading(false)
      return
    }

    // Step 2: update the password immediately — same page, same session
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message || 'Failed to set password. Please request a new reset link.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    setStep('done')
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

  if (step === 'done') {
    return (
      <div className="max-w-md mx-auto px-6 py-24">
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 mb-6">
          <p className="text-sm text-green-800 font-medium">Password updated!</p>
          <p className="text-sm text-green-700 mt-0.5">You can now log in with your new password.</p>
        </div>
        <a href="/login" className="block w-full text-center bg-[#534AB7] text-white py-2 rounded-md text-sm font-medium hover:bg-[#4339A0] transition-colors">
          Go to log in
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Set a new password</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
          />
        </div>

        {error && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm text-amber-800">{error}</p>
            <p className="text-sm text-amber-700 mt-1">
              <a href="/forgot-password" className="underline underline-offset-2">Request a new reset link</a>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#534AB7] text-white py-2 rounded-md text-sm font-medium hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving…' : 'Set new password'}
        </button>
      </form>
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
