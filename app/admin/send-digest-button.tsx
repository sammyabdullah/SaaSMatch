'use client'

import { useState } from 'react'
import { triggerMonthlyDigest } from './digest-actions'

export default function SendDigestButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleClick() {
    setState('loading')
    setMessage(null)
    try {
      const data = await triggerMonthlyDigest()
      if (data.error) {
        setState('error')
        setMessage(data.error)
      } else if (data.skipped) {
        setState('done')
        setMessage(`Skipped — ${data.reason}`)
      } else {
        setState('done')
        setMessage(`Sent ${data.emailsSent} of ${data.total} emails`)
      }
    } catch {
      setState('error')
      setMessage('Request failed')
    }
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <button
        onClick={handleClick}
        disabled={state === 'loading'}
        className="text-sm font-medium bg-[#534AB7] text-white px-4 py-2 rounded-lg hover:bg-[#4339a8] disabled:opacity-50 transition-colors"
      >
        {state === 'loading' ? 'Sending…' : 'Send digest now'}
      </button>
      {message && (
        <p className={`text-sm ${state === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
