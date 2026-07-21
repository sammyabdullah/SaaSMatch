'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  sendConnectionAcceptedLenderEmail,
  sendConnectionAcceptedFounderFromLenderEmail,
  sendAdminLenderConnectionEmail,
} from '@/lib/email'

export async function acceptLenderFlag(flagId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  const { data: flag } = await admin
    .from('lender_flags')
    .select('*')
    .eq('id', flagId)
    .eq('status', 'pending')
    .single()

  if (!flag) return { error: 'Flag not found or already responded to' }

  // The accepting user must be the recipient (default-deny)
  const isAuthorized =
    (flag.flagged_by === 'lender' && flag.founder_id === user.id) ||
    (flag.flagged_by === 'founder' && flag.lender_id === user.id)
  if (!isAuthorized) return { error: 'Not authorized' }

  const [{ data: founderPause }, { data: lenderPause }] = await Promise.all([
    admin.from('profiles').select('is_paused').eq('id', flag.founder_id).single(),
    admin.from('profiles').select('is_paused').eq('id', flag.lender_id).single(),
  ])
  if (founderPause?.is_paused || lenderPause?.is_paused) {
    return { error: 'This user is no longer available.' }
  }

  const { data: updatedRows, error: updateError } = await admin
    .from('lender_flags')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: 'accepted', responded_at: new Date().toISOString() } as any)
    .eq('id', flagId)
    .eq('status', 'pending')
    .select('id')

  if (updateError) return { error: updateError.message }
  if (!updatedRows || updatedRows.length === 0) return { error: 'Flag already processed' }

  try {
    const [founderProfile, founderAuthProfile, lenderProfile, lenderAuthProfile] =
      await Promise.all([
        admin.from('founder_profiles')
          .select('company_name, website, location, stage, arr_range, product_categories, mom_growth_pct, raising_amount_usd, why_now')
          .eq('id', flag.founder_id)
          .single(),
        admin.from('profiles').select('email').eq('id', flag.founder_id).single(),
        admin.from('lender_profiles')
          .select('institution_name, contact_name, website, location, loan_size_min_usd, loan_size_max_usd, stages, geography_focus, thesis_statement')
          .eq('id', flag.lender_id)
          .single(),
        admin.from('profiles').select('email').eq('id', flag.lender_id).single(),
      ])

    const founderEmail = founderAuthProfile.data?.email ?? ''
    const lenderEmail = lenderAuthProfile.data?.email ?? ''
    const fp = founderProfile.data
    const lp = lenderProfile.data

    if (flag.flagged_by === 'lender') {
      // Founder accepted lender's flag → notify both parties
      await Promise.allSettled([
        sendConnectionAcceptedLenderEmail({
          lenderEmail,
          lenderName: lp?.contact_name ?? '',
          founderEmail,
          founderCompanyName: fp?.company_name ?? null,
          founderWebsite: fp?.website ?? null,
          founderLocation: fp?.location ?? null,
          founderStage: fp?.stage ?? '',
          founderArrRange: fp?.arr_range ?? null,
          founderCategories: fp?.product_categories ?? [],
          founderMomGrowthPct: fp?.mom_growth_pct ?? null,
          founderRaisingAmount: fp?.raising_amount_usd ?? null,
          founderWhyNow: fp?.why_now ?? null,
        }),
        sendConnectionAcceptedFounderFromLenderEmail({
          founderEmail,
          lenderInstitutionName: lp?.institution_name ?? '',
          lenderContactName: lp?.contact_name ?? '',
          lenderWebsite: lp?.website ?? null,
          lenderLocation: lp?.location ?? null,
          lenderLoanSizeMin: lp?.loan_size_min_usd ?? null,
          lenderLoanSizeMax: lp?.loan_size_max_usd ?? null,
          lenderStages: lp?.stages ?? [],
          lenderGeography: lp?.geography_focus ?? null,
          lenderThesis: lp?.thesis_statement ?? null,
          lenderEmail,
        }),
        sendAdminLenderConnectionEmail({
          founderEmail,
          lenderInstitutionName: lp?.institution_name ?? '',
          lenderEmail,
          initiatedBy: 'lender',
        }),
      ])
    } else {
      // Lender accepted a founder's flag → notify both parties
      await Promise.allSettled([
        sendConnectionAcceptedFounderFromLenderEmail({
          founderEmail,
          lenderInstitutionName: lp?.institution_name ?? '',
          lenderContactName: lp?.contact_name ?? '',
          lenderWebsite: lp?.website ?? null,
          lenderLocation: lp?.location ?? null,
          lenderLoanSizeMin: lp?.loan_size_min_usd ?? null,
          lenderLoanSizeMax: lp?.loan_size_max_usd ?? null,
          lenderStages: lp?.stages ?? [],
          lenderGeography: lp?.geography_focus ?? null,
          lenderThesis: lp?.thesis_statement ?? null,
          lenderEmail,
        }),
        sendConnectionAcceptedLenderEmail({
          lenderEmail,
          lenderName: lp?.contact_name ?? '',
          founderEmail,
          founderCompanyName: fp?.company_name ?? null,
          founderWebsite: fp?.website ?? null,
          founderLocation: fp?.location ?? null,
          founderStage: fp?.stage ?? '',
          founderArrRange: fp?.arr_range ?? null,
          founderCategories: fp?.product_categories ?? [],
          founderMomGrowthPct: fp?.mom_growth_pct ?? null,
          founderRaisingAmount: fp?.raising_amount_usd ?? null,
          founderWhyNow: fp?.why_now ?? null,
        }),
        sendAdminLenderConnectionEmail({
          founderEmail,
          lenderInstitutionName: lp?.institution_name ?? '',
          lenderEmail,
          initiatedBy: 'founder',
        }),
      ])
    }
  } catch {
    // Email errors are non-fatal
  }

  revalidatePath('/dashboard')
  revalidatePath('/discover')
  return { success: true }
}

export async function declineLenderFlag(flagId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  const { data: flag } = await admin
    .from('lender_flags')
    .select('id, flagged_by, lender_id, founder_id')
    .eq('id', flagId)
    .eq('status', 'pending')
    .single()

  if (!flag) return { error: 'Flag not found or already responded to' }

  if (flag.flagged_by === 'lender' && flag.founder_id !== user.id) {
    return { error: 'Not authorized' }
  }
  if (flag.flagged_by === 'founder' && flag.lender_id !== user.id) {
    return { error: 'Not authorized' }
  }

  const { data: updatedRows, error } = await admin
    .from('lender_flags')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: 'declined', responded_at: new Date().toISOString() } as any)
    .eq('id', flagId)
    .eq('status', 'pending')
    .select('id')

  if (error) return { error: error.message }
  if (!updatedRows || updatedRows.length === 0) return { error: 'Flag already processed' }

  revalidatePath('/dashboard')
  revalidatePath('/discover')
  return { success: true }
}
