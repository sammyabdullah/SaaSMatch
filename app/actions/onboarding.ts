'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type {
  FounderStage,
  ArrRange,
  GtmMotion,
  RevenueModel,
} from '@/lib/supabase/types'

export interface FounderProfileInput {
  company_name: string
  location: string
  founded_year: number
  stage: FounderStage
  product_categories: string[]
  arr_range: ArrRange
  mom_growth_pct: number
  nrr_pct: number
  acv_usd: number
  gtm_motion: GtmMotion
  revenue_model: RevenueModel
  why_now: string
  raising_amount_usd: number
  wants_lead: boolean
  wants_board_seat: boolean
  check_size_min_usd: number
  check_size_max_usd: number
  geography_preference: string
}

export interface InvestorProfileInput {
  firm_name: string
  partner_name: string
  location: string
  check_size_min_usd: number
  check_size_max_usd: number
  stages: FounderStage[]
  leads_rounds: boolean
  takes_board_seat: boolean
  geography_focus: string
  saas_subcategories: string[]
  arr_sweet_spot_min: number
  arr_sweet_spot_max: number
  thesis_statement: string
  value_beyond_capital: string
  typical_response_days: number
}

export async function submitFounderProfile(data: FounderProfileInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase.from('founder_profiles').insert({
    id: user.id,
    ...data,
    status: 'pending',
    is_approved: false,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function submitInvestorProfile(data: InvestorProfileInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase.from('investor_profiles').insert({
    id: user.id,
    ...data,
    is_approved: false,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
