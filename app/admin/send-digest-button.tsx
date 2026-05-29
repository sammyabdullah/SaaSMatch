'use client'

import { useState } from 'react'
import { triggerMonthlyDigest, triggerUnmatchedDigest, sendTestDigestToEmail } from '@/app/actions/admin'

const btnCls = 'px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const inputCls = 'border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent w-64'

export default function SendDigestButton() {
  const [matchedLoading, setMatchedLoading] = useState(false)
  const [matchedResult, setMatchedResult] = useState<{ emailsSent: number; total: number } | null>(null)
  const [matchedError, setMatchedError] = useState('')

  const [unmatchedLoading, setUnmatchedLoading] = useState(false)
  const [unmatchedResult, setUnmatchedResult] = useState<{ emailsSent: number; total: number } | null>(null)
  const [unmatchedError, setUnmatchedError] = useState('')

  const [testEmail, setTestEmail] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState('')
  const [testError, setTestError] = useState('')

  async function handleMatched() {
    if (!confirm('Send the monthly digest to all founders, investors, and lenders WITH matches now?')) return
    setMatchedLoading(true)
    setMatchedResult(null)
    setMatchedError('')
    const res = await triggerMonthlyDigest()
    if (res.error) setMatchedError(res.error)
    else setMatchedResult({ emailsSent: res.emailsSent ?? 0, total: res.total ?? 0 })
    setMatchedLoading(false)
  }

  async function handleUnmatched() {
    if (!confirm('Send the platform update to all founders, investors, and lenders with NO matches now?')) return
    setUnmatchedLoading(true)
    setUnmatchedResult(null)
    setUnmatchedError('')
    const res = await triggerUnmatchedDigest()
    if (res.error) setUnmatchedError(res.error)
    else setUnmatchedResult({ emailsSent: res.emailsSent ?? 0, total: res.total ?? 0 })
    setUnmatchedLoading(false)
  }

  async function handleTest(e: React.FormEvent) {
    e.preventDefault()
    if (!testEmail) return
    setTestLoading(true)
    setTestResult('')
    setTestError('')
    const res = await sendTestDigestToEmail(testEmail)
    if (res.error) setTestError(res.error)
    else setTestResult(`Sent 3 sample emails (founder, investor, lender) to ${testEmail}`)
    setTestLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Send to matched */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Founders, investors, and lenders who have at least one match.</p>
        <div className="flex items-center gap-4">
          <button onClick={handleMatched} disabled={matchedLoading} className={btnCls}>
            {matchedLoading ? 'Sending…' : 'Send digest — matched users'}
          </button>
          {matchedResult && <p className="text-sm text-green-600">Done — {matchedResult.emailsSent} of {matchedResult.total} sent.</p>}
          {matchedError && <p className="text-sm text-red-500">{matchedError}</p>}
        </div>
      </div>

      {/* Send to unmatched */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Founders, investors, and lenders with no matches — platform stats only.</p>
        <div className="flex items-center gap-4">
          <button onClick={handleUnmatched} disabled={unmatchedLoading} className={btnCls}>
            {unmatchedLoading ? 'Sending…' : 'Send digest — unmatched users'}
          </button>
          {unmatchedResult && <p className="text-sm text-green-600">Done — {unmatchedResult.emailsSent} of {unmatchedResult.total} sent.</p>}
          {unmatchedError && <p className="text-sm text-red-500">{unmatchedError}</p>}
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
