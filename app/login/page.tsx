'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn, resendConfirmationEmail } from '@/app/actions/auth'

declare global {
  interface Window {
    hcaptcha?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
    }
  }
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const widgetIdRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const justSignedUp = searchParams.get('verify') === '1'
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY

  const isUnconfirmed = error === 'email_not_confirmed'

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    const script = document.createElement('script')
    script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.hcaptcha && containerRef.current) {
        widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
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
    setResendSent(false)
    if (siteKey && !captchaToken) {
      setError('Please complete the security check.')
      return
    }
    setLoading(true)
    const result = await signIn(email, password, captchaToken || undefined)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      if (widgetIdRef.current && window.hcaptcha) {
        window.hcaptcha.reset(widgetIdRef.current)
        setCaptchaToken('')
      }
    }
  }

  async function handleResend() {
    setResendLoading(true)
    const result = await resendConfirmationEmail(email)
    setResendLoading(false)
    if (!result?.error) setResendSent(true)
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      {justSignedUp && (
        <p className="text-sm text-orange-500 mb-6">
          We just sent you a confirmation email. Go click it, and come on back.
        </p>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Log in to <span className="font-black tracking-widest uppercase"><span className="text-black">Founder</span><span className="text-[#29ABE2]">Invited</span></span>
        </h1>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
          />
        </div>

        {siteKey && <div ref={containerRef} />}

        {isUnconfirmed ? (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 space-y-2">
            <p className="text-sm text-amber-800">
              Your email address hasn&apos;t been confirmed yet. Check your inbox for the confirmation link we sent when you signed up.
            </p>
            {resendSent ? (
              <p className="text-sm text-green-700 font-medium">Confirmation email resent — check your inbox.</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-sm text-amber-900 underline underline-offset-2 disabled:opacity-50"
              >
                {resendLoading ? 'Sending…' : 'Resend confirmation email'}
              </button>
            )}
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading || (!!siteKey && !captchaToken)}
          className="w-full bg-[#534AB7] text-white py-2 rounded-md text-sm font-medium hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-gray-500 text-center mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[#534AB7] hover:underline">Sign up</Link>
      </p>
      <p className="text-sm text-gray-500 text-center mt-2">
        <Link href="/forgot-password" className="text-[#534AB7] hover:underline">Forgot password?</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-6 py-24" />}>
      <LoginForm />
    </Suspense>
  )
}
