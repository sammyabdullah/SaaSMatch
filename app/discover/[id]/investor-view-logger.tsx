'use client'

import { useEffect } from 'react'
import { logInvestorProfileView } from '@/app/actions/discover'

export function InvestorViewLogger({ investorId }: { investorId: string }) {
  useEffect(() => {
    logInvestorProfileView(investorId)
  }, [investorId])
  return null
}
