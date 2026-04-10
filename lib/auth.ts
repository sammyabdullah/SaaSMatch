import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Returns the current authenticated user plus their profile row.
 * Call this at the top of any protected Server Component.
 * Redirects to /login if no session exists.
 */
export async function getUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return { user, profile }
}

/**
 * Returns the current user's onboarding status.
 * Does NOT redirect — returns null if not logged in.
 */
export async function getOnboardingStatus() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  if (profile.role === 'founder') {
    const { data: fp } = await supabase
      .from('founder_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    return { role: profile.role, onboarded: !!fp }
  }

  if (profile.role === 'investor') {
    const { data: ip } = await supabase
      .from('investor_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    return { role: profile.role, onboarded: !!ip }
  }

  // admins are always considered onboarded
  return { role: profile.role, onboarded: true }
}
