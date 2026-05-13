'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveFounder, rejectFounder, approveInvestor, rejectInvestor, deleteFounderProfile, deleteInvestorProfile, approveLender, rejectLender, deleteLenderProfile } from '@/app/actions/admin'

export function ApproveButton({ founderId }: { founderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApprove() {
    setLoading(true)
    setError('')
    try {
      await approveFounder(founderId)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleApprove} disabled={loading}
        className="px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Approving…' : 'Approve'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function RejectButton({ founderId }: { founderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleReject() {
    if (!confirm('Reject this profile? This will set their status to closed.')) return
    setLoading(true)
    setError('')
    try {
      await rejectFounder(founderId)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rejection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleReject} disabled={loading}
        className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-md hover:border-gray-400 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Rejecting…' : 'Reject'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function DeleteFounderButton({ founderId }: { founderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Permanently delete this founder profile? The auth account will remain intact. This cannot be undone.')) return
    setLoading(true)
    try {
      await deleteFounderProfile(founderId)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading}
      className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
      {loading ? 'Deleting…' : 'Delete profile'}
    </button>
  )
}

export function ApproveInvestorButton({ investorId }: { investorId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApprove() {
    setLoading(true)
    setError('')
    try {
      await approveInvestor(investorId)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleApprove} disabled={loading}
        className="px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Approving…' : 'Approve'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function RejectInvestorButton({ investorId }: { investorId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleReject() {
    if (!confirm('Remove this investor profile? This cannot be undone.')) return
    setLoading(true)
    setError('')
    try {
      await rejectInvestor(investorId)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rejection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleReject} disabled={loading}
        className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-md hover:border-gray-400 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Removing…' : 'Reject'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function DeleteInvestorButton({ investorId }: { investorId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Permanently delete this investor profile? The auth account will remain intact. This cannot be undone.')) return
    setLoading(true)
    try {
      await deleteInvestorProfile(investorId)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading}
      className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
      {loading ? 'Deleting…' : 'Delete profile'}
    </button>
  )
}

export function ApproveLenderButton({ lenderId }: { lenderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApprove() {
    setLoading(true)
    setError('')
    try {
      await approveLender(lenderId)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleApprove} disabled={loading}
        className="px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Approving…' : 'Approve'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function RejectLenderButton({ lenderId }: { lenderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleReject() {
    if (!confirm('Remove this lender profile? This cannot be undone.')) return
    setLoading(true)
    setError('')
    try {
      await rejectLender(lenderId)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rejection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleReject} disabled={loading}
        className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-md hover:border-gray-400 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Removing…' : 'Reject'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function DeleteLenderButton({ lenderId }: { lenderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Permanently delete this lender profile? The auth account will remain intact. This cannot be undone.')) return
    setLoading(true)
    try {
      await deleteLenderProfile(lenderId)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading}
      className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
      {loading ? 'Deleting…' : 'Delete profile'}
    </button>
  )
}
