'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendWelcomeFounderEmail, sendWelcomeInvestorEmail } from '@/lib/email'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')
}

export async function approveFounder(founderId: string) {
  await requireAdmin()

  const admin = createAdminClient()
  const { error } = await admin
    .from('founder_profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ is_approved: true, status: 'active', approved_at: new Date().toISOString() } as any)
    .eq('id', founderId)

  if (error) throw new Error(error.message)

  try {
    const { data: profile } = await admin.from('profiles').select('email').eq('id', founderId).single()
    if (profile?.email) await sendWelcomeFounderEmail({ email: profile.email })
  } catch {
    // Email errors are non-fatal
  }

  revalidatePath('/admin')
}

export async function approveInvestor(investorId: string) {
  await requireAdmin()

  const admin = createAdminClient()
  const { error } = await admin
    .from('investor_profiles')
    .update({ is_approved: true })
    .eq('id', investorId)

  if (error) throw new Error(error.message)

  try {
    const { data: profile } = await admin.from('profiles').select('email').eq('id', investorId).single()
    if (profile?.email) await sendWelcomeInvestorEmail({ email: profile.email })
  } catch {
    // Email errors are non-fatal
  }

  revalidatePath('/admin')
}

export async function rejectInvestor(investorId: string) {
  await requireAdmin()

  const admin = createAdminClient()
  const { error } = await admin
    .from('investor_profiles')
    .delete()
    .eq('id', investorId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
}

export async function rejectFounder(founderId: string) {
  await requireAdmin()

  const admin = createAdminClient()
  const { error } = await admin
    .from('founder_profiles')
    .update({ status: 'closed' })
    .eq('id', founderId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
}
