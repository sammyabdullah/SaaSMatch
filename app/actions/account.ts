'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FounderProfileInput, InvestorProfileInput, LenderProfileInput } from '@/app/actions/onboarding'

export async function updateFounderProfile(
  data: FounderProfileInput
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('founder_profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/account')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateInvestorProfile(
  data: InvestorProfileInput
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('investor_profiles')
    .update({
      firm_name: data.firm_name,
      partner_name: data.partner_name,
      website: data.website ?? null,
      location: data.location,
      check_size_min_usd: data.check_size_min_usd,
      check_size_max_usd: data.check_size_max_usd,
      stages: data.stages,
      leads_rounds: data.leads_rounds,
      geography_focus: data.geography_focus,
      saas_subcategories: data.saas_subcategories,
      arr_sweet_spot_min: data.arr_sweet_spot_min,
      arr_sweet_spot_max: data.arr_sweet_spot_max,
      thesis_statement: data.thesis_statement,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/account')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateLenderProfile(
  data: LenderProfileInput
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('lender_profiles')
    .update({
      institution_name: data.institution_name,
      contact_name: data.contact_name,
      website: data.website ?? null,
      location: data.location,
      loan_size_min_usd: data.loan_size_min_usd,
      loan_size_max_usd: data.loan_size_max_usd,
      loan_types: data.loan_types,
      stages: data.stages,
      geography_focus: data.geography_focus,
      saas_subcategories: data.saas_subcategories,
      arr_min_requirement: data.arr_min_requirement,
      arr_max_sweet_spot: data.arr_max_sweet_spot,
      thesis_statement: data.thesis_statement,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/account')
  revalidatePath('/dashboard')
  return { success: true }
}


export async function changePassword(
  password: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true }
}

export async function pauseProfile(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }

  if (profile.role === 'founder') {
    const { error } = await supabase
      .from('founder_profiles')
      .update({ status: 'pending' })
      .eq('id', user.id)
    if (error) return { error: error.message }
  } else if (profile.role === 'investor') {
    const { error } = await supabase
      .from('investor_profiles')
      .update({ is_approved: false })
      .eq('id', user.id)
    if (error) return { error: error.message }
  } else if (profile.role === 'lender') {
    const { error } = await supabase
      .from('lender_profiles')
      .update({ is_approved: false })
      .eq('id', user.id)
    if (error) return { error: error.message }
  }

  revalidatePath('/account')
  return { success: true }
}

export async function deleteAccount(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const admin = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'founder') {
    await admin.from('founder_profiles').delete().eq('id', user.id)
  } else if (profile?.role === 'investor') {
    await admin.from('investor_profiles').delete().eq('id', user.id)
  } else if (profile?.role === 'lender') {
    await admin.from('lender_profiles').delete().eq('id', user.id)
  }

  await admin.from('profiles').delete().eq('id', user.id)
  await admin.auth.admin.deleteUser(user.id)

  redirect('/')
}
