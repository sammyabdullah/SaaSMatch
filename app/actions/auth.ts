'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(email: string, password: string, role: string) {
  const supabase = await createClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://saa-s-match.vercel.app'

  const { error } = await supabase.auth.signUp({
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

  redirect('/onboarding')
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  const userId = data.user.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { error: 'Account setup incomplete. Please contact support.' }
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
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
