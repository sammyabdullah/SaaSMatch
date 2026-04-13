'use client'

import { useState } from 'react'
import { approveFounder, rejectFounder } from '@/app/actions/admin'

export function ApproveButton({ founderId }: { founderId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    setLoading(true)
    await approveFounder(founderId)
    setLoading(false)
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Approving…' : 'Approve'}
    </button>
  )
}

export function RejectButton({ founderId }: { founderId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleReject() {
    if (!confirm('Reject this profile? This will set their status to closed.')) return
    setLoading(true)
    await rejectFounder(founderId)
    setLoading(false)
  }

  return (
    <button
      onClick={handleReject}
      disabled={loading}
      className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-md hover:border-gray-400 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Rejecting…' : 'Reject'}
    </button>
  )
}
