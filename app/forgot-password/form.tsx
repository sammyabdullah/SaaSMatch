'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { forgotPassword } from '@/app/actions/auth'

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
    }
  }
}

interface Props {
  expiredLink?: boolean
}

export default function ForgotPasswordForm({ expiredLink }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const widgetIdRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.turnstile && containerRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(''),
          'error-callback': () => setCaptchaToken(''),
        })
      }
    }
    document.head.appendChild(script)
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [siteKey])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (siteKey && !captchaToken) {
      setError('Please complete the security check.')
      return
    }
    setLoading(true)
    try {
      const result = await forgotPassword(email, captchaToken || undefined)
      if (result?.error) {
        setError(result.error)
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
          setCaptchaToken('')
        }
      } else {
        setSent(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Reset your password</h1>
        <p className="text-sm text-gray-500 mt-2">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {expiredLink && (
        <div className="mb-6 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-sm text-amber-800">
            Your password reset link has expired or was already used. Enter your email below and we&apos;ll send you a fresh one.
          </p>
        </div>
      )}

      {sent && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3">
          <p className="text-sm text-green-800 font-medium">Reset link sent!</p>
          <p className="text-sm text-green-700 mt-0.5">
            Check your inbox at <span className="font-medium">{email}</span> and click the link to set a new password. If you don&apos;t see it within a few minutes, check your spam folder.
          </p>
          <p className="text-sm text-green-700 mt-2">
            Still no email?{' '}
            <a href="mailto:sammy@blossomstreetventures.com" className="underline underline-offset-2">
              Contact support
            </a>
            {' '}and we&apos;ll get you sorted.
          </p>
        </div>
      )}

      {!sent && (
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

          {siteKey && <div ref={containerRef} />}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || (!!siteKey && !captchaToken)}
            className="w-full bg-[#534AB7] text-white py-2 rounded-md text-sm font-medium hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="text-sm text-gray-500 text-center mt-6">
        <Link href="/login" className="text-[#534AB7] hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  )
}
