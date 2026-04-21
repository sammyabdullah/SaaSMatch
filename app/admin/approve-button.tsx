'use client'

import { useState } from 'react'
import { approveFounder, rejectFounder, approveInvestor, rejectInvestor, deleteFounderProfile, deleteInvestorProfile, approveLender, rejectLender, deleteLenderProfile } from '@/app/actions/admin'

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

export function ApproveInvestorButton({ investorId }: { investorId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    setLoading(true)
    await approveInvestor(investorId)
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

export function DeleteFounderButton({ founderId }: { founderId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Permanently delete this founder profile? The auth account will remain intact. This cannot be undone.')) return
    setLoading(true)
    await deleteFounderProfile(founderId)
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Deleting…' : 'Delete profile'}
    </button>
  )
}

export function ApproveLenderButton({ lenderId }: { lenderId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    setLoading(true)
    await approveLender(lenderId)
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

export function RejectLenderButton({ lenderId }: { lenderId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleReject() {
    if (!confirm('Remove this lender profile? This cannot be undone.')) return
    setLoading(true)
    await rejectLender(lenderId)
    setLoading(false)
  }

  return (
    <button
      onClick={handleReject}
      disabled={loading}
      className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-md hover:border-gray-400 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Removing…' : 'Reject'}
    </button>
  )
}

export function DeleteLenderButton({ lenderId }: { lenderId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Permanently delete this lender profile? The auth account will remain intact. This cannot be undone.')) return
    setLoading(true)
    await deleteLenderProfile(lenderId)
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Deleting…' : 'Delete profile'}
    </button>
  )
}

export function DeleteInvestorButton({ investorId }: { investorId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Permanently delete this investor profile? The auth account will remain intact. This cannot be undone.')) return
    setLoading(true)
    await deleteInvestorProfile(investorId)
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Deleting…' : 'Delete profile'}
    </button>
  )
}

export function RejectInvestorButton({ investorId }: { investorId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleReject() {
    if (!confirm('Remove this investor profile? This cannot be undone.')) return
    setLoading(true)
    await rejectInvestor(investorId)
    setLoading(false)
  }

  return (
    <button
      onClick={handleReject}
      disabled={loading}
      className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-md hover:border-gray-400 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Removing…' : 'Reject'}
    </button>
  )
}
