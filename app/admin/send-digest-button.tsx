'use client'

import { useState } from 'react'
import { triggerMonthlyDigest } from '@/app/actions/admin'

export default function SendDigestButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ emailsSent: number; total: number } | null>(null)
  const [error, setError] = useState('')

  async function handleClick() {
    if (!confirm('Send the monthly digest to all matched founders, investors, and lenders now?')) return
    setLoading(true)
    setResult(null)
    setError('')
    const res = await triggerMonthlyDigest()
    if (res.error) {
      setError(res.error)
    } else {
      setResult({ emailsSent: res.emailsSent ?? 0, total: res.total ?? 0 })
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending…' : 'Send monthly digest now'}
      </button>
      {result && (
        <p className="text-sm text-green-600">
          Done — {result.emailsSent} of {result.total} emails sent.
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
