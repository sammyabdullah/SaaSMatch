'use client'

import { useState } from 'react'
import { adminUploadFounderDeck, adminRemoveFounderDeck } from '@/app/actions/admin'

const MAX_MB = 15
const MAX_BYTES = MAX_MB * 1024 * 1024

interface Props {
  founderId: string
  currentDeckUrl: string | null
}

export default function AdminDeckUpload({ founderId, currentDeckUrl }: Props) {
  const [deckUrl, setDeckUrl] = useState(currentDeckUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > MAX_BYTES) {
      setError(`File is too large — maximum is ${MAX_MB} MB.`)
      return
    }

    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('deck', file)

    const result = await adminUploadFounderDeck(founderId, formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.deckUrl) {
      setDeckUrl(result.deckUrl)
    }
    setLoading(false)
  }

  async function handleRemove() {
    setLoading(true)
    setError('')
    const result = await adminRemoveFounderDeck(founderId)
    if (result?.error) {
      setError(result.error)
    } else {
      setDeckUrl(null)
    }
    setLoading(false)
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">Pitch deck</p>
      {deckUrl ? (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={deckUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#534AB7] hover:underline"
          >
            View deck ↗
          </a>
          <label
            className={`text-xs text-gray-500 hover:text-[#534AB7] border border-gray-200 px-2 py-1 rounded-md cursor-pointer transition-colors ${loading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {loading ? 'Uploading…' : 'Replace'}
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              disabled={loading}
              onChange={handleFileChange}
            />
          </label>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          className={`inline-flex text-xs text-gray-500 hover:text-[#534AB7] border border-gray-200 px-2 py-1 rounded-md cursor-pointer transition-colors ${loading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {loading ? 'Uploading…' : 'Upload PDF'}
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            disabled={loading}
            onChange={handleFileChange}
          />
        </label>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
