'use client'

import { useState } from 'react'
import { pauseProfile, deleteAccount } from '@/app/actions/account'
import type { UserRole } from '@/lib/supabase/types'

interface Props {
  role: UserRole
}

export default function DangerZone({ role }: Props) {
  const [pauseLoading, setPauseLoading] = useState(false)
  const [pauseError, setPauseError] = useState('')
  const [pauseSuccess, setPauseSuccess] = useState(false)

  const [deleteText, setDeleteText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handlePause() {
    if (!window.confirm('Are you sure you want to pause your profile? It will no longer be visible to others.')) {
      return
    }
    setPauseLoading(true)
    setPauseError('')
    const result = await pauseProfile()
    if (result?.error) {
      setPauseError(result.error)
    } else {
      setPauseSuccess(true)
    }
    setPauseLoading(false)
  }

  async function handleDelete() {
    if (deleteText !== 'DELETE') return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deleteAccount()
      // deleteAccount redirects to '/', so we won't reach this
    } catch {
      setDeleteError('An error occurred. Please try again.')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Pause profile */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          {role === 'founder' ? 'Pause your profile' : 'Deactivate your profile'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {role === 'founder'
            ? 'Your profile will be set to pending and hidden from investor discovery. You can reactivate it later by editing your profile.'
            : 'Your profile will be hidden from founder discovery. Contact support to reactivate.'}
        </p>
        {pauseSuccess ? (
          <p className="text-sm text-amber-600">Profile paused. It is no longer visible to others.</p>
        ) : (
          <div>
            <button
              onClick={handlePause}
              disabled={pauseLoading}
              className="text-sm border border-amber-500 text-amber-600 hover:bg-amber-50 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pauseLoading ? 'Pausing…' : 'Pause my profile'}
            </button>
            {pauseError && <p className="text-sm text-red-600 mt-2">{pauseError}</p>}
          </div>
        )}
      </div>

      {/* Delete account */}
      <div className="border border-red-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-red-700 mb-1">Delete account</h3>
        <p className="text-sm text-gray-500 mb-4">
          This is permanent and cannot be undone. Your profile, matches, and all associated data will be deleted immediately.
        </p>
        <div className="space-y-3 max-w-sm">
          <label className="block text-sm text-gray-600">
            Type <strong>DELETE</strong> to confirm:
          </label>
          <input
            type="text"
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            placeholder="DELETE"
          />
          <button
            onClick={handleDelete}
            disabled={deleteText !== 'DELETE' || deleteLoading}
            className="text-sm bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleteLoading ? 'Deleting…' : 'Delete my account'}
          </button>
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
        </div>
      </div>
    </div>
  )
}
