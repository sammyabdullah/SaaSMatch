'use client'

import { useEffect } from 'react'
import { logLenderProfileView } from '@/app/actions/discover'

export function LenderViewLogger({ lenderId }: { lenderId: string }) {
  useEffect(() => {
    logLenderProfileView(lenderId)
  }, [lenderId])
  return null
}
