'use client'

import { useState } from 'react'
import { uploadFounderDeck, removeFounderDeck } from '@/app/actions/account'

const MAX_MB = 15
const MAX_BYTES = MAX_MB * 1024 * 1024

interface Props {
  currentDeckUrl: string | null
}

export default function DeckUpload({ currentDeckUrl }: Props) {
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

    const result = await uploadFounderDeck(formData)
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
    const result = await removeFounderDeck()
    if (result?.error) {
      setError(result.error)
    } else {
      setDeckUrl(null)
    }
    setLoading(false)
  }

  return (
    <div>
      {deckUrl ? (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={deckUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#534AB7] hover:underline font-medium"
          >
            View current deck ↗
          </a>
          <label
            className={`text-xs text-gray-500 hover:text-[#534AB7] border border-gray-200 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${loading ? 'opacity-50 pointer-events-none' : ''}`}
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
            className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Removing…' : 'Remove'}
          </button>
        </div>
      ) : (
        <label
          className={`inline-flex items-center gap-2 text-sm border border-[#534AB7] text-[#534AB7] hover:bg-[#534AB7] hover:text-white px-4 py-2 rounded-md cursor-pointer transition-colors ${loading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {loading ? 'Uploading…' : `Upload deck (PDF, max ${MAX_MB} MB)`}
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            disabled={loading}
            onChange={handleFileChange}
          />
        </label>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
