import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FounderForm from '@/components/onboarding/founder-form'
import InvestorForm from '@/components/onboarding/investor-form'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Already onboarded — send to dashboard
  if (profile.role === 'founder') {
    const { data: fp } = await supabase
      .from('founder_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (fp) redirect('/dashboard')
    return (
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-1">Founder profile</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            Tell us about your company
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Your profile is reviewed before going live. Investors will only see
            what you share here.
          </p>
        </div>
        <FounderForm />
      </div>
    )
  }

  if (profile.role === 'investor') {
    const { data: ip } = await supabase
      .from('investor_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (ip) redirect('/dashboard')
    return (
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-1">Investor profile</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            Complete your thesis profile
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            A complete thesis profile is required before you can browse
            founders.
          </p>
        </div>
        <InvestorForm />
      </div>
    )
  }

  // Admins skip onboarding
  redirect('/dashboard')
}
