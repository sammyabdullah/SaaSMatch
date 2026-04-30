'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { flagInvestor, unflagInvestor, flagFounder, unflagFounder, flagFounderAsLender, unflagFounderAsLender } from '@/app/actions/discover'

interface Props {
  targetId: string
  mode: 'founder-flagging-investor' | 'investor-flagging-founder' | 'lender-flagging-founder'
  isAlreadyFlagged: boolean
}

export default function FlagActionButton({ targetId, mode, isAlreadyFlagged }: Props) {
  const router = useRouter()
  const [flagged, setFlagged] = useState(isAlreadyFlagged)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFlag() {
    setLoading(true)
    setError('')
    let result
    if (mode === 'founder-flagging-investor') {
      result = await flagInvestor(targetId)
    } else if (mode === 'lender-flagging-founder') {
      result = await flagFounderAsLender(targetId)
    } else {
      result = await flagFounder(targetId)
    }
    if (result?.error) {
      setError(result.error)
    } else {
      setFlagged(true)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleUnflag() {
    setLoading(true)
    setError('')
    let result
    if (mode === 'founder-flagging-investor') {
      result = await unflagInvestor(targetId)
    } else if (mode === 'lender-flagging-founder') {
      result = await unflagFounderAsLender(targetId)
    } else {
      result = await unflagFounder(targetId)
    }
    if (result?.error) {
      setError(result.error)
    } else {
      setFlagged(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div>
      {flagged ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-green-600 font-medium">
            {mode === 'founder-flagging-investor' ? 'Connection request sent ✓' : 'Interest expressed ✓'}
          </span>
          <button
            onClick={handleUnflag}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Removing…' : 'Remove'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleFlag}
          disabled={loading}
          className="px-6 py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#534AB7] text-white hover:bg-[#4339A0]"
        >
          {loading
            ? 'Processing…'
            : mode === 'founder-flagging-investor'
            ? 'Send connection request'
            : 'Express interest'}
        </button>
      )}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
}
