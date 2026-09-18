'use client'

import { useState } from 'react'
import { resetFounderCredits } from '@/app/actions/admin'

const btnCls = 'px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export default function ResetCreditsButton() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleReset() {
    if (!confirm('Reset all founders to 50 connection requests immediately?')) return
    setLoading(true)
    setStatus('idle')
    try {
      const res = await resetFounderCredits()
      if (res.error) {
        setErrorMsg(res.error)
        setStatus('error')
      } else {
        setStatus('done')
      }
    } catch {
      setErrorMsg('Something went wrong')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button onClick={handleReset} disabled={loading} className={btnCls}>
        {loading ? 'Resetting…' : 'Reset founder credits now'}
      </button>
      {status === 'done' && <p className="text-sm text-green-600">Done — all founders reset to 50 requests.</p>}
      {status === 'error' && <p className="text-sm text-red-500">{errorMsg}</p>}
    </div>
  )
}
