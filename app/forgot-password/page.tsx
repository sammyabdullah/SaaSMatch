'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await forgotPassword(email)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Check your email</h1>
        <p className="text-sm text-gray-500 mb-8">
          We sent a password reset link to <span className="font-medium text-gray-700">{email}</span>. Click the link in that email to set a new password.
        </p>
        <Link href="/login" className="text-sm text-[#534AB7] hover:underline">
          Back to log in
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Reset your password</h1>
        <p className="text-sm text-gray-500 mt-2">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#534AB7] text-white py-2 rounded-md text-sm font-medium hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="text-sm text-gray-500 text-center mt-6">
        <Link href="/login" className="text-[#534AB7] hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  )
}
