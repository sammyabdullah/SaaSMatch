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

  const admin = createAdminClient()

  const { error } = await admin.from('profiles').update({ is_paused: true }).eq('id', user.id)
  if (error) return { error: error.message }

  await Promise.all([
    admin.from('flags').delete().eq('status', 'pending').or(`founder_id.eq.${user.id},investor_id.eq.${user.id}`),
    admin.from('lender_flags').delete().eq('status', 'pending').or(`founder_id.eq.${user.id},lender_id.eq.${user.id}`),
  ])

  await supabase.auth.signOut()
  redirect('/login')
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

  if (!profile) redirect('/')

  // Delete auth account before profile data; if this fails, nothing is orphaned
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteUserError) throw new Error('Failed to delete account. Please contact support.')

  if (profile.role === 'founder') {
    await admin.from('flags').delete().eq('founder_id', user.id)
    await admin.from('lender_flags').delete().eq('founder_id', user.id)
    await admin.from('profile_views').delete().eq('founder_id', user.id)
    await admin.from('investor_profile_views').delete().eq('founder_id', user.id)
    await admin.from('lender_profile_views').delete().eq('founder_id', user.id)
    await admin.from('founder_profiles').delete().eq('id', user.id)
  } else if (profile.role === 'investor') {
    await admin.from('flags').delete().eq('investor_id', user.id)
    await admin.from('profile_views').delete().eq('investor_id', user.id)
    await admin.from('investor_profile_views').delete().eq('investor_id', user.id)
    await admin.from('investor_profiles').delete().eq('id', user.id)
  } else if (profile.role === 'lender') {
    await admin.from('lender_flags').delete().eq('lender_id', user.id)
    await admin.from('lender_profile_views').delete().eq('lender_id', user.id)
    await admin.from('lender_profiles').delete().eq('id', user.id)
  }

  await admin.from('profiles').delete().eq('id', user.id)

  redirect('/')
}

const MAX_DECK_BYTES = 15 * 1024 * 1024 // 15 MB

export async function uploadFounderDeck(
  formData: FormData
): Promise<{ error?: string; deckUrl?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('deck') as File | null
  if (!file || file.size === 0) return { error: 'No file provided.' }
  if (file.size > MAX_DECK_BYTES) return { error: 'File must be 15 MB or smaller.' }
  if (file.type !== 'application/pdf') return { error: 'Only PDF files are accepted.' }

  const admin = createAdminClient()
  const bytes = await file.arrayBuffer()
  const path = `${user.id}.pdf`

  const { error: uploadError } = await admin.storage
    .from('decks')
    .upload(path, bytes, { upsert: true, contentType: 'application/pdf' })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = admin.storage.from('decks').getPublicUrl(path)

  const { error: dbError } = await admin
    .from('founder_profiles')
    .update({ deck_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (dbError) return { error: dbError.message }

  revalidatePath('/account')
  revalidatePath('/discover')
  return { deckUrl: publicUrl }
}

export async function removeFounderDeck(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  await admin.storage.from('decks').remove([`${user.id}.pdf`])

  const { error } = await admin
    .from('founder_profiles')
    .update({ deck_url: null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/account')
  revalidatePath('/discover')
  return { success: true }
}
