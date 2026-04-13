'use client'

import { useEffect } from 'react'
import { logProfileView } from '@/app/actions/discover'

export function ViewLogger({ founderId }: { founderId: string }) {
  useEffect(() => {
    logProfileView(founderId)
  }, [founderId])
  return null
}
