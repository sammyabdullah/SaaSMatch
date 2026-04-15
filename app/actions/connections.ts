'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  sendConnectionAcceptedFounderEmail,
  sendConnectionAcceptedInvestorEmail,
  sendAdminConnectionEmail,
} from '@/lib/email'

// ─── Accept an incoming flag ──────────────────────────────────────────────────
// Called by the party that received the flag (not the one who sent it).
export async function acceptFlag(flagId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // Fetch the flag to verify ownership and get both parties' IDs
  const { data: flag } = await admin
    .from('flags')
    .select('*')
    .eq('id', flagId)
    .eq('status', 'pending')
    .single()

  if (!flag) return { error: 'Flag not found or already responded to' }

  // Verify the accepting user is the correct recipient
  if (flag.flagged_by === 'founder' && flag.investor_id !== user.id) {
    return { error: 'Not authorized' }
  }
  if (flag.flagged_by === 'investor' && flag.founder_id !== user.id) {
    return { error: 'Not authorized' }
  }

  // Mark the flag as accepted
  const { error: updateError } = await admin
    .from('flags')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: 'accepted', responded_at: new Date().toISOString() } as any)
    .eq('id', flagId)

  if (updateError) return { error: updateError.message }

  // Fetch details for notification emails
  try {
    const [founderProfile, founderAuthProfile, investorProfile, investorAuthProfile] =
      await Promise.all([
        admin.from('founder_profiles')
          .select('company_name, website, location, stage, arr_range, product_categories, mom_growth_pct, raising_amount_usd, why_now')
          .eq('id', flag.founder_id)
          .single(),
        admin.from('profiles').select('email').eq('id', flag.founder_id).single(),
        admin.from('investor_profiles')
          .select('firm_name, partner_name, website, location, check_size_min_usd, check_size_max_usd, stages, geography_focus, thesis_statement')
          .eq('id', flag.investor_id)
          .single(),
        admin.from('profiles').select('email').eq('id', flag.investor_id).single(),
      ])

    const founderEmail = founderAuthProfile.data?.email ?? ''
    const investorEmail = investorAuthProfile.data?.email ?? ''
    const fp = founderProfile.data
    const ip = investorProfile.data

    if (flag.flagged_by === 'founder') {
      // Investor accepted a founder's flag → notify the founder
      await Promise.allSettled([
        sendConnectionAcceptedFounderEmail({
          founderEmail,
          investorFirmName: ip?.firm_name ?? '',
          investorPartnerName: ip?.partner_name ?? '',
          investorWebsite: ip?.website ?? null,
          investorLocation: ip?.location ?? null,
          investorCheckSizeMin: ip?.check_size_min_usd ?? null,
          investorCheckSizeMax: ip?.check_size_max_usd ?? null,
          investorStages: ip?.stages ?? [],
          investorGeography: ip?.geography_focus ?? null,
          investorThesis: ip?.thesis_statement ?? null,
          investorEmail,
        }),
        sendAdminConnectionEmail({
          founderEmail,
          investorFirmName: ip?.firm_name ?? '',
          investorEmail,
          initiatedBy: 'founder',
        }),
      ])
    } else {
      // Founder accepted an investor's flag → notify the investor
      await Promise.allSettled([
        sendConnectionAcceptedInvestorEmail({
          investorEmail,
          investorName: ip?.partner_name ?? '',
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
        sendAdminConnectionEmail({
          founderEmail,
          investorFirmName: ip?.firm_name ?? '',
          investorEmail,
          initiatedBy: 'investor',
        }),
      ])
    }
  } catch {
    // Email errors are non-fatal — acceptance is already saved
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Decline an incoming flag ─────────────────────────────────────────────────
export async function declineFlag(flagId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  const { data: flag } = await admin
    .from('flags')
    .select('id, flagged_by, investor_id, founder_id')
    .eq('id', flagId)
    .eq('status', 'pending')
    .single()

  if (!flag) return { error: 'Flag not found or already responded to' }

  if (flag.flagged_by === 'founder' && flag.investor_id !== user.id) {
    return { error: 'Not authorized' }
  }
  if (flag.flagged_by === 'investor' && flag.founder_id !== user.id) {
    return { error: 'Not authorized' }
  }

  const { error } = await admin
    .from('flags')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: 'declined', responded_at: new Date().toISOString() } as any)
    .eq('id', flagId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
