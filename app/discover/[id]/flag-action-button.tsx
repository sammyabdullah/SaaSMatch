'use client'

import { useState } from 'react'
import { flagInvestor, unflagInvestor, flagFounder, unflagFounder } from '@/app/actions/discover'

interface Props {
  targetId: string
  mode: 'founder-flagging-investor' | 'investor-flagging-founder'
  isAlreadyFlagged: boolean
  flagCount: number
}

export default function FlagActionButton({ targetId, mode, isAlreadyFlagged, flagCount }: Props) {
  const [flagged, setFlagged] = useState(isAlreadyFlagged)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const atLimit = mode === 'founder-flagging-investor' && flagCount >= 10 && !flagged

  async function handleFlag() {
    setLoading(true)
    setError('')
    let result
    if (mode === 'founder-flagging-investor') {
      result = await flagInvestor(targetId)
    } else {
      result = await flagFounder(targetId)
    }
    if (result?.error) {
      setError(result.error)
    } else {
      setFlagged(true)
    }
    setLoading(false)
  }

  async function handleUnflag() {
    setLoading(true)
    setError('')
    let result
    if (mode === 'founder-flagging-investor') {
      result = await unflagInvestor(targetId)
    } else {
      result = await unflagFounder(targetId)
    }
    if (result?.error) {
      setError(result.error)
    } else {
      setFlagged(false)
    }
    setLoading(false)
  }

  return (
    <div>
      {flagged ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-green-600 font-medium">
            {mode === 'founder-flagging-investor' ? 'Interest flagged ✓' : 'Interest expressed ✓'}
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
          disabled={loading || atLimit}
          className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            atLimit
              ? 'bg-gray-100 text-gray-400'
              : 'bg-[#534AB7] text-white hover:bg-[#4339A0]'
          }`}
        >
          {loading
            ? 'Processing…'
            : atLimit
            ? 'Flag limit reached (10 max)'
            : mode === 'founder-flagging-investor'
            ? 'Flag interest'
            : 'Express interest'}
        </button>
      )}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
}
