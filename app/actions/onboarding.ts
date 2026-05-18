'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sendAdminNewFounderEmail, sendAdminNewInvestorEmail, sendAdminNewLenderEmail } from '@/lib/email'
import type {
  FounderStage,
  ArrRange,
  GtmMotion,
  RevenueModel,
} from '@/lib/supabase/types'

export interface FounderProfileInput {
  company_name: string
  website: string
  location: string
  founded_year: number
  stage: FounderStage
  product_categories: string[]
  arr_range: ArrRange
  mom_growth_pct?: number | null
  gtm_motion: GtmMotion
  revenue_model: RevenueModel
  raising_amount_usd: number
  why_now: string
}

export interface InvestorProfileInput {
  firm_name: string
  partner_name: string
  website?: string | null
  location: string
  check_size_min_usd: number
  check_size_max_usd: number
  stages: FounderStage[]
  leads_rounds: boolean
  geography_focus: string
  saas_subcategories: string[]
  arr_sweet_spot_min: number
  arr_sweet_spot_max: number
  thesis_statement: string
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
    // Fields removed from form — set safe defaults
    mom_growth_pct: data.mom_growth_pct ?? null,
    nrr_pct: null,
    acv_usd: null,
    status: 'pending',
    is_approved: false,
  })

  if (error) {
    return { error: error.message }
  }

  try {
    await sendAdminNewFounderEmail({
      email: user.email ?? '',
      company_name: data.company_name,
      location: data.location,
      stage: data.stage,
      arr_range: data.arr_range,
      raising_amount_usd: data.raising_amount_usd,
    })
  } catch {
    // Email errors are non-fatal
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

  try {
    await sendAdminNewInvestorEmail({
      email: user.email ?? '',
      firm_name: data.firm_name,
      partner_name: data.partner_name,
      location: data.location,
      check_size_min_usd: data.check_size_min_usd,
      check_size_max_usd: data.check_size_max_usd,
    })
  } catch {
    // Email errors are non-fatal
  }

  return { success: true }
}

export interface LenderProfileInput {
  institution_name: string
  contact_name: string
  website?: string | null
  location: string
  loan_size_min_usd: number
  loan_size_max_usd: number
  loan_types: string[]
  stages: FounderStage[]
  geography_focus: string
  saas_subcategories: string[]
  arr_min_requirement: number
  arr_max_sweet_spot: number
  thesis_statement: string
}

export async function submitLenderProfile(data: LenderProfileInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase.from('lender_profiles').insert({
    id: user.id,
    ...data,
    is_approved: false,
  })

  if (error) {
    return { error: error.message }
  }

  try {
    await sendAdminNewLenderEmail({
      email: user.email ?? '',
      institution_name: data.institution_name,
      contact_name: data.contact_name,
      location: data.location,
      loan_size_min_usd: data.loan_size_min_usd,
      loan_size_max_usd: data.loan_size_max_usd,
    })
  } catch {
    // Email errors are non-fatal
  }

  return { success: true }
}
