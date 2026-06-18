'use client'

import { useState } from 'react'
import { triggerDigest, sendTestDigestToEmail } from '@/app/actions/admin'

const btnCls = 'px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const inputCls = 'border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent w-64'
const textareaCls = 'w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent resize-none'

export default function SendDigestButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ emailsSent: number; total: number; skipped: number } | null>(null)
  const [error, setError] = useState('')

  const [testEmail, setTestEmail] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState('')
  const [testError, setTestError] = useState('')

  const [customMessage, setCustomMessage] = useState('')

  async function handleSend() {
    if (!confirm('Send the monthly digest to all founders, investors, and lenders now?')) return
    setLoading(true)
    setResult(null)
    setError('')
    const res = await triggerDigest(customMessage.trim() || undefined)
    if (res.error) setError(res.error)
    else setResult({ emailsSent: res.emailsSent ?? 0, total: res.total ?? 0, skipped: res.skipped ?? 0 })
    setLoading(false)
  }

  async function handleTest(e: React.FormEvent) {
    e.preventDefault()
    if (!testEmail) return
    setTestLoading(true)
    setTestResult('')
    setTestError('')
    const res = await sendTestDigestToEmail(testEmail, customMessage.trim() || undefined)
    if (res.error) setTestError(res.error)
    else setTestResult(`Sent 3 sample emails (founder, investor, lender) to ${testEmail}`)
    setTestLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Custom opening message */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">
          Opening paragraph <span className="text-gray-400">(optional — appears at the top of every digest email)</span>
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          rows={3}
          className={textareaCls}
          placeholder="e.g. Big news this month — we've added 10 new investors to the platform…"
        />
      </div>

      {/* Send to everyone */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Sends to all approved founders, investors, and lenders. Users with matches see their matches; everyone sees platform activity.</p>
        <div className="flex items-center gap-4">
          <button onClick={handleSend} disabled={loading} className={btnCls}>
            {loading ? 'Sending…' : 'Send monthly digest'}
          </button>
          {result && (
            <p className="text-sm text-green-600">
              Done — {result.emailsSent} of {result.total} sent.
              {result.skipped > 0 ? ` (${result.skipped} skipped — no profile email found)` : ''}
            </p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>

      {/* Test send */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Send all 3 digest types (founder, investor, lender) to any address for preview.</p>
        <form onSubmit={handleTest} className="flex items-center gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
            required
          />
          <button type="submit" disabled={testLoading} className={btnCls}>
            {testLoading ? 'Sending…' : 'Send test digest'}
          </button>
          {testResult && <p className="text-sm text-green-600">{testResult}</p>}
          {testError && <p className="text-sm text-red-500">{testError}</p>}
        </form>
      </div>
    </div>
  )
}
