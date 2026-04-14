'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptFlag, declineFlag } from '@/app/actions/connections'

interface Props {
  flagId: string
}

export default function AcceptDeclineFlag({ flagId }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'accepting' | 'declining' | 'accepted' | 'declined'>('idle')
  const [error, setError] = useState('')

  async function handleAccept() {
    setStatus('accepting')
    setError('')
    const result = await acceptFlag(flagId)
    if (result.error) {
      setError(result.error)
      setStatus('idle')
    } else {
      setStatus('accepted')
      router.refresh()
    }
  }

  async function handleDecline() {
    setStatus('declining')
    setError('')
    const result = await declineFlag(flagId)
    if (result.error) {
      setError(result.error)
      setStatus('idle')
    } else {
      setStatus('declined')
      router.refresh()
    }
  }

  if (status === 'accepted') {
    return <span className="text-xs font-medium text-green-600">Connected ✓</span>
  }
  if (status === 'declined') {
    return <span className="text-xs text-gray-400">Declined</span>
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleAccept}
        disabled={status === 'accepting' || status === 'declining'}
        className="text-xs font-medium bg-[#534AB7] text-white px-3 py-1.5 rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50"
      >
        {status === 'accepting' ? 'Connecting…' : 'Connect'}
      </button>
      <button
        onClick={handleDecline}
        disabled={status === 'accepting' || status === 'declining'}
        className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
      >
        {status === 'declining' ? '…' : 'Decline'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
