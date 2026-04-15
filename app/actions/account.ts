'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FounderProfileInput, InvestorProfileInput } from '@/app/actions/onboarding'

export async function updateFounderProfile(
  data: FounderProfileInput
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if expired and approved — if so, reactivate
  const { data: existing } = await supabase
    .from('founder_profiles')
    .select('status, is_approved')
    .eq('id', user.id)
    .single()

  const extraFields: Record<string, string> = {}
  if (existing?.status === 'expired' && existing?.is_approved === true) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 180)
    extraFields.status = 'active'
    extraFields.profile_expires_at = expiresAt.toISOString()
  }

  const { error } = await supabase
    .from('founder_profiles')
    .update({
      ...data,
      ...extraFields,
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
      value_beyond_capital: '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/account')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function restartFounderClock(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 180)

  const { error } = await admin
    .from('founder_profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ profile_expires_at: expiresAt.toISOString(), status: 'active', updated_at: new Date().toISOString() } as any)
    .eq('id', user.id)

  if (error) return { error: error.message }
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
  }

  await admin.from('profiles').delete().eq('id', user.id)
  await admin.auth.admin.deleteUser(user.id)

  redirect('/')
}
