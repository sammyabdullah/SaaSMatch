'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { unflagLenderAsFounder } from '@/app/actions/discover'

interface Props {
  lenderId: string
}

export default function UnflagFounderLenderFlag({ lenderId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleUnflag() {
    setLoading(true)
    setError('')
    try {
      const result = await unflagLenderAsFounder(lenderId)
      if (result?.error) {
        setError(result.error)
      } else {
        setDone(true)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return <span className="text-xs text-gray-400">Removed</span>
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleUnflag}
        disabled={loading}
        className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Removing…' : 'Unflag'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
