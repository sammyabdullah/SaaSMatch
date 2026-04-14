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
          .select('stage, product_categories')
          .eq('id', flag.founder_id)
          .single(),
        admin.from('profiles').select('email').eq('id', flag.founder_id).single(),
        admin.from('investor_profiles')
          .select('firm_name, partner_name')
          .eq('id', flag.investor_id)
          .single(),
        admin.from('profiles').select('email').eq('id', flag.investor_id).single(),
      ])

    const founderEmail = founderAuthProfile.data?.email ?? ''
    const investorEmail = investorAuthProfile.data?.email ?? ''
    const firmName = investorProfile.data?.firm_name ?? ''
    const partnerName = investorProfile.data?.partner_name ?? ''

    if (flag.flagged_by === 'founder') {
      // Investor accepted a founder's flag → notify the founder
      await Promise.allSettled([
        sendConnectionAcceptedFounderEmail({
          founderEmail,
          investorFirmName: firmName,
          investorPartnerName: partnerName,
          investorEmail,
        }),
        sendAdminConnectionEmail({
          founderEmail,
          investorFirmName: firmName,
          investorEmail,
          initiatedBy: 'founder',
        }),
      ])
    } else {
      // Founder accepted an investor's flag → notify the investor
      await Promise.allSettled([
        sendConnectionAcceptedInvestorEmail({
          investorEmail,
          investorName: partnerName,
          founderEmail,
          founderCategories: founderProfile.data?.product_categories ?? [],
          founderStage: founderProfile.data?.stage ?? '',
        }),
        sendAdminConnectionEmail({
          founderEmail,
          investorFirmName: firmName,
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
