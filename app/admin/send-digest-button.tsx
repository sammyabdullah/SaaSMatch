'use client'

import { useState } from 'react'
import { triggerDigest, sendTestDigestToEmail } from '@/app/actions/admin'

const btnCls = 'px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const inputCls = 'border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent w-64'
const textareaCls = 'w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent resize-none'

interface Props {
  savedOpeningParagraph: string
  savedSubjectLine: string
}

export default function SendDigestButton({ savedOpeningParagraph, savedSubjectLine }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ emailsSent: number; total: number; skipped: number } | null>(null)
  const [error, setError] = useState('')

  const [testEmail, setTestEmail] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState('')
  const [testError, setTestError] = useState('')

  const [openingParagraph, setOpeningParagraph] = useState(savedOpeningParagraph)
  const [subjectLine, setSubjectLine] = useState(savedSubjectLine)

  async function handleSend() {
    if (!confirm('Send the monthly digest to all founders, investors, and lenders now?')) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await triggerDigest(openingParagraph.trim() || undefined, subjectLine.trim() || undefined)
      if (res.error) setError(res.error)
      else setResult({ emailsSent: res.emailsSent ?? 0, total: res.total ?? 0, skipped: res.skipped ?? 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleTest(e: React.FormEvent) {
    e.preventDefault()
    if (!testEmail) return
    setTestLoading(true)
    setTestResult('')
    setTestError('')
    try {
      const res = await sendTestDigestToEmail(testEmail, openingParagraph.trim() || undefined, subjectLine.trim() || undefined)
      if (res.error) setTestError(res.error)
      else setTestResult(`Sent 3 sample emails (founder, investor, lender) to ${testEmail}`)
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Subject line */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Subject line</label>
        <input
          value={subjectLine}
          onChange={(e) => setSubjectLine(e.target.value)}
          className={textareaCls}
          placeholder="FounderInvited update"
        />
        <p className="text-xs text-gray-400 mt-1">Leave blank to use the default: &ldquo;FounderInvited update&rdquo;</p>
      </div>

      {/* Opening paragraph */}
      <div>
        {savedOpeningParagraph && (
          <div className="mb-3 border border-gray-100 rounded-md p-3 bg-gray-50">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Last opening paragraph sent</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{savedOpeningParagraph}</p>
          </div>
        )}
        <label className="block text-xs text-gray-500 mb-1">Opening paragraph</label>
        <textarea
          value={openingParagraph}
          onChange={(e) => setOpeningParagraph(e.target.value)}
          rows={4}
          className={textareaCls}
          placeholder="Write your opening message here. The first line will be bold. Leave blank to send without one."
        />
        <p className="text-xs text-gray-400 mt-1">Appears at the top of every digest email in a highlighted box. The first paragraph is bold.</p>
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
