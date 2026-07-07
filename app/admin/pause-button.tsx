'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { pauseUser, unpauseUser } from '@/app/actions/admin'

export function PauseUserButton({ userId, isPaused }: { userId: string; isPaused: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [paused, setPaused] = useState(isPaused)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    const result = paused ? await unpauseUser(userId) : await pauseUser(userId)
    if (result?.error) {
      setError(result.error)
    } else {
      setPaused(!paused)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          paused
            ? 'border-green-500 text-green-600 hover:bg-green-50'
            : 'border-amber-400 text-amber-600 hover:bg-amber-50'
        }`}
      >
        {loading ? '…' : paused ? 'Unpause' : 'Pause'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
