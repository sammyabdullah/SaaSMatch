'use client'

import { useState } from 'react'
import { markMatchResponded } from '@/app/actions/matches'

interface Props {
  matchId: string
}

export default function MarkRespondedButton({ matchId }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    const result = await markMatchResponded(matchId)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
        Responded
      </span>
    )
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-xs text-white bg-[#534AB7] hover:bg-[#4339A0] px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Marking…' : 'Mark as responded'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
