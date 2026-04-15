'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { restartFounderClock } from '@/app/actions/account'

export default function RestartClockButton() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleClick() {
    setStatus('loading')
    const result = await restartFounderClock()
    if (result.success) {
      setStatus('done')
      router.refresh()
    } else {
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return <span className="text-xs text-green-600 mt-2 block">Restarted ✓</span>
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === 'loading'}
      className="mt-2 text-xs text-[#534AB7] hover:underline disabled:opacity-50"
    >
      {status === 'loading' ? 'Restarting…' : 'Restart clock'}
    </button>
  )
}
