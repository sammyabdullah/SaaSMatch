'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  sendFounderFlaggedInvestorEmail,
  sendInvestorFlaggedFounderEmail,
  sendLenderFlaggedFounderEmail,
} from '@/lib/email'

// ─── Founder flags an investor ────────────────────────────────────────────────
export async function flagInvestor(investorId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  const [{ count: investorCount }, { count: lenderCount }] = await Promise.all([
    admin.from('flags').select('id', { count: 'exact', head: true }).eq('founder_id', user.id).eq('flagged_by', 'founder').eq('status', 'pending'),
    admin.from('lender_flags').select('id', { count: 'exact', head: true }).eq('founder_id', user.id).eq('flagged_by', 'founder').eq('status', 'pending'),
  ])
  if ((investorCount ?? 0) + (lenderCount ?? 0) >= 15) {
    return { error: 'You have reached the 15-request limit. Remove an existing request or wait for one to be accepted.' }
  }

  const { error } = await admin.from('flags').insert({
    founder_id: user.id,
    investor_id: investorId,
    flagged_by: 'founder',
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      // Already flagged — treat as success
      revalidatePath('/discover')
      revalidatePath('/dashboard')
      return { success: true }
    }
    return { error: error.message }
  }

  // Send notification email to the investor
  try {
    const [{ data: ip }, { data: fp }, { data: founderProfile }] = await Promise.all([
      admin.from('investor_profiles').select('partner_name').eq('id', investorId).single(),
      admin.from('profiles').select('email').eq('id', investorId).single(),
      admin.from('founder_profiles')
        .select('stage, arr_range, raising_amount_usd, product_categories, mom_growth_pct, why_now, location')
        .eq('id', user.id)
        .single(),
    ])

    if (ip && fp?.email && founderProfile) {
      await sendFounderFlaggedInvestorEmail({
        investorEmail: fp.email,
        founder: founderProfile as Parameters<typeof sendFounderFlaggedInvestorEmail>[0]['founder'],
      })
    }
  } catch {
    // Email errors are non-fatal — flag is already saved
  }

  revalidatePath('/discover')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Founder unflags an investor (only while still pending) ──────────────────
export async function unflagInvestor(investorId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('flags')
    .delete()
    .eq('founder_id', user.id)
    .eq('investor_id', investorId)
    .eq('flagged_by', 'founder')
    .eq('status', 'pending')

  if (error) return { error: error.message }
  revalidatePath('/discover')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Investor flags a founder ─────────────────────────────────────────────────
export async function flagFounder(founderId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  const { error } = await admin.from('flags').insert({
    founder_id: founderId,
    investor_id: user.id,
    flagged_by: 'investor',
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      revalidatePath('/discover')
      revalidatePath('/dashboard')
      return { success: true }
    }
    return { error: error.message }
  }

  // Send notification email to the founder
  try {
    const [{ data: ip }, { data: founderProfileRow }] = await Promise.all([
      admin.from('investor_profiles')
        .select('firm_name, partner_name, check_size_min_usd, check_size_max_usd, stages, geography_focus, thesis_statement')
        .eq('id', user.id)
        .single(),
      admin.from('profiles').select('email').eq('id', founderId).single(),
    ])

    if (ip && founderProfileRow?.email) {
      await sendInvestorFlaggedFounderEmail({
        founderEmail: founderProfileRow.email,
        investor: ip as Parameters<typeof sendInvestorFlaggedFounderEmail>[0]['investor'],
      })
    }
  } catch {
    // Email errors are non-fatal
  }

  revalidatePath('/discover')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Investor unflags a founder (only while still pending) ───────────────────
export async function unflagFounder(founderId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('flags')
    .delete()
    .eq('investor_id', user.id)
    .eq('founder_id', founderId)
    .eq('flagged_by', 'investor')
    .eq('status', 'pending')

  if (error) return { error: error.message }
  revalidatePath('/discover')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Founder expresses interest in a lender ──────────────────────────────────
export async function flagLenderAsFounder(lenderId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  const [{ count: investorCount }, { count: lenderCount }] = await Promise.all([
    admin.from('flags').select('id', { count: 'exact', head: true }).eq('founder_id', user.id).eq('flagged_by', 'founder').eq('status', 'pending'),
    admin.from('lender_flags').select('id', { count: 'exact', head: true }).eq('founder_id', user.id).eq('flagged_by', 'founder').eq('status', 'pending'),
  ])
  if ((investorCount ?? 0) + (lenderCount ?? 0) >= 15) {
    return { error: 'You have reached the 15-request limit. Remove an existing request or wait for one to be accepted.' }
  }

  const { error } = await admin.from('lender_flags').insert({
    founder_id: user.id,
    lender_id: lenderId,
    flagged_by: 'founder',
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      revalidatePath('/discover')
      revalidatePath('/dashboard')
      return { success: true }
    }
    return { error: error.message }
  }

  revalidatePath('/discover')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Founder withdraws interest in a lender ──────────────────────────────────
export async function unflagLenderAsFounder(lenderId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('lender_flags')
    .delete()
    .eq('founder_id', user.id)
    .eq('lender_id', lenderId)
    .eq('flagged_by', 'founder')
    .eq('status', 'pending')

  if (error) return { error: error.message }
  revalidatePath('/discover')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Lender flags a founder ───────────────────────────────────────────────────
export async function flagFounderAsLender(founderId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  const { error } = await admin.from('lender_flags').insert({
    founder_id: founderId,
    lender_id: user.id,
    flagged_by: 'lender',
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      revalidatePath('/discover')
      revalidatePath('/dashboard')
      return { success: true }
    }
    return { error: error.message }
  }

  try {
    const [{ data: lp }, { data: founderProfileRow }] = await Promise.all([
      admin.from('lender_profiles')
        .select('institution_name, contact_name, loan_size_min_usd, loan_size_max_usd, stages, geography_focus, thesis_statement')
        .eq('id', user.id)
        .single(),
      admin.from('profiles').select('email').eq('id', founderId).single(),
    ])

    if (lp && founderProfileRow?.email) {
      await sendLenderFlaggedFounderEmail({
        founderEmail: founderProfileRow.email,
        lender: lp as Parameters<typeof sendLenderFlaggedFounderEmail>[0]['lender'],
      })
    }
  } catch {
    // Email errors are non-fatal
  }

  revalidatePath('/discover')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Lender unflags a founder (only while still pending) ─────────────────────
export async function unflagFounderAsLender(founderId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('lender_flags')
    .delete()
    .eq('lender_id', user.id)
    .eq('founder_id', founderId)
    .eq('flagged_by', 'lender')
    .eq('status', 'pending')

  if (error) return { error: error.message }
  revalidatePath('/discover')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Log a profile view ───────────────────────────────────────────────────────
export async function logProfileView(founderId: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'investor') return

    const admin = createAdminClient()
    await admin.from('profile_views').insert({
      investor_id: user.id,
      founder_id: founderId,
    })
  } catch {
    // Don't throw on view logging errors
  }
}
