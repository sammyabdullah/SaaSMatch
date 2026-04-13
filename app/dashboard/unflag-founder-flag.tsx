'use client'

import { useState } from 'react'
import { unflagInvestor } from '@/app/actions/discover'

interface Props {
  investorId: string
}

export default function UnflagFounderFlag({ investorId }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleUnflag() {
    setLoading(true)
    await unflagInvestor(investorId)
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return <span className="text-xs text-gray-400">Removed</span>
  }

  return (
    <button
      onClick={handleUnflag}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Removing…' : 'Unflag'}
    </button>
  )
}
