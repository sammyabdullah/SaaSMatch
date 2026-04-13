'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function flagInvestor(investorId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('flags').insert({
    founder_id: user.id,
    investor_id: investorId,
    flagged_by: 'founder',
  })

  if (error) return { error: error.message }
  revalidatePath('/discover')
  return { success: true }
}

export async function unflagInvestor(investorId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('flags')
    .delete()
    .eq('founder_id', user.id)
    .eq('investor_id', investorId)
    .eq('flagged_by', 'founder')

  if (error) return { error: error.message }
  revalidatePath('/discover')
  return { success: true }
}

export async function flagFounder(founderId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('flags').insert({
    founder_id: founderId,
    investor_id: user.id,
    flagged_by: 'investor',
  })

  if (error) return { error: error.message }
  revalidatePath('/discover')
  return { success: true }
}

export async function unflagFounder(founderId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('flags')
    .delete()
    .eq('investor_id', user.id)
    .eq('founder_id', founderId)
    .eq('flagged_by', 'investor')

  if (error) return { error: error.message }
  revalidatePath('/discover')
  return { success: true }
}

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

    await supabase.from('profile_views').insert({
      investor_id: user.id,
      founder_id: founderId,
    })
  } catch {
    // Don't throw on view logging errors
  }
}
