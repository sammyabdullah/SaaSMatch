'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(email: string, password: string, role: string) {
  const supabase = await createClient()

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://founderinvited.com'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // If a session was created the project has email confirmation disabled —
  // user is already logged in, send them straight to onboarding.
  // Otherwise they need to confirm their email first.
  if (data.session) {
    redirect('/onboarding')
  }
  redirect('/auth/confirmed')
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('user not found')) {
      return { error: 'Email not registered or incorrect password.' }
    }
    if (msg.includes('email not confirmed')) {
      return { error: 'email_not_confirmed' }
    }
    return { error: error.message }
  }

  const userId = data.user.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_paused')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { error: 'Account setup incomplete. Please contact support.' }
  }

  if (profile.is_paused) {
    await supabase.auth.signOut()
    return { error: 'Your account is paused. Please contact us to reactivate.' }
  }

  // Check whether onboarding is complete
  if (profile.role === 'founder') {
    const { data: fp } = await supabase
      .from('founder_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!fp) redirect('/onboarding')
  } else if (profile.role === 'investor') {
    const { data: ip } = await supabase
      .from('investor_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!ip) redirect('/onboarding')
  } else if (profile.role === 'lender') {
    const { data: lp } = await supabase
      .from('lender_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!lp) redirect('/onboarding')
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function forgotPassword(email: string) {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://founderinvited.com'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?type=recovery`,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function resendConfirmationEmail(email: string) {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://founderinvited.com'

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  return { success: true }
}
