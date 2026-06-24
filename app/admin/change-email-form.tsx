'use client'

import { useState } from 'react'
import { changeUserEmail, setUserPassword, deleteUserByEmail } from '@/app/actions/admin'

export default function ChangeEmailForm() {
  const [currentEmail, setCurrentEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  const [pwEmail, setPwEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  const [delEmail, setDelEmail] = useState('')
  const [delLoading, setDelLoading] = useState(false)
  const [delError, setDelError] = useState('')
  const [delSuccess, setDelSuccess] = useState('')

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailLoading(true)
    setEmailError('')
    setEmailSuccess('')
    try {
      const result = await changeUserEmail(currentEmail, newEmail)
      if (result?.error) {
        setEmailError(result.error)
      } else {
        setEmailSuccess(`Email updated: ${currentEmail} → ${newEmail}`)
        setCurrentEmail('')
        setNewEmail('')
      }
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setEmailLoading(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwLoading(true)
    setPwError('')
    setPwSuccess('')
    try {
      const result = await setUserPassword(pwEmail, newPassword)
      if (result?.error) {
        setPwError(result.error)
      } else {
        setPwSuccess(`Password updated for ${pwEmail}`)
        setPwEmail('')
        setNewPassword('')
      }
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Current email</label>
            <input
              type="email"
              required
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">New email</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={emailLoading}
            className="px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {emailLoading ? 'Updating…' : 'Update email'}
          </button>
          {emailError && <p className="text-sm text-red-500">{emailError}</p>}
          {emailSuccess && <p className="text-sm text-green-600">{emailSuccess}</p>}
        </div>
      </form>

      <div className="border-t border-gray-100 pt-8">
        <p className="text-sm font-medium text-gray-700 mb-4">Set user password</p>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">User email</label>
              <input
                type="email"
                required
                value={pwEmail}
                onChange={(e) => setPwEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">New password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="min 8 characters"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={pwLoading}
              className="px-4 py-2 bg-[#534AB7] text-white text-sm font-medium rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pwLoading ? 'Updating…' : 'Set password'}
            </button>
            {pwError && <p className="text-sm text-red-500">{pwError}</p>}
            {pwSuccess && <p className="text-sm text-green-600">{pwSuccess}</p>}
          </div>
        </form>
      </div>
      <div className="border-t border-gray-100 pt-8">
        <p className="text-sm font-medium text-gray-700 mb-1">Delete user by email</p>
        <p className="text-xs text-gray-400 mb-4">Permanently removes the auth account, profile, and all associated data (flags, views).</p>
        <form onSubmit={async (e) => {
          e.preventDefault()
          if (!confirm(`Permanently delete the user ${delEmail}? This cannot be undone.`)) return
          setDelLoading(true)
          setDelError('')
          setDelSuccess('')
          try {
            const result = await deleteUserByEmail(delEmail)
            if (result?.error) setDelError(result.error)
            else { setDelSuccess(`Deleted ${delEmail}`); setDelEmail('') }
          } catch (err) {
            setDelError(err instanceof Error ? err.message : 'Delete failed')
          } finally {
            setDelLoading(false)
          }
        }} className="space-y-4">
          <div className="max-w-sm">
            <label className="block text-xs text-gray-500 mb-1">User email</label>
            <input
              type="email"
              required
              value={delEmail}
              onChange={(e) => setDelEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={delLoading}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {delLoading ? 'Deleting…' : 'Delete user'}
            </button>
            {delError && <p className="text-sm text-red-500">{delError}</p>}
            {delSuccess && <p className="text-sm text-green-600">{delSuccess}</p>}
          </div>
        </form>
      </div>
    </div>
  )
}
