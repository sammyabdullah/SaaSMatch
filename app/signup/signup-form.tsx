'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signUp } from '@/app/actions/auth'

declare global {
  interface Window {
    hcaptcha?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
    }
  }
}

export default function SignupForm() {
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')
  const role = roleParam === 'investor' ? 'investor' : roleParam === 'lender' ? 'lender' : 'founder'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const widgetIdRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY

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

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (siteKey && !captchaToken) {
      setError('Please complete the security check.')
      return
    }

    setLoading(true)
    const result = await signUp(email, password, role, captchaToken || undefined)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      if (widgetIdRef.current && window.hcaptcha) {
        window.hcaptcha.reset(widgetIdRef.current)
        setCaptchaToken('')
      }
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-1">
          Signing up as a{' '}
          <span className="text-[#534AB7] font-medium">
            {role === 'founder' ? 'founder' : role === 'lender' ? 'lender' : 'investor'}
          </span>
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">
          Create your account
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
            placeholder="Minimum 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
            placeholder="Repeat your password"
          />
        </div>

        {siteKey && <div ref={containerRef} />}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || (!!siteKey && !captchaToken)}
          className="w-full bg-[#534AB7] text-white py-2 rounded-md text-sm font-medium hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-gray-500 text-center mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[#534AB7] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
