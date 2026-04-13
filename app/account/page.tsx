import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FounderAccountForm from './founder-account-form'
import InvestorAccountForm from './investor-account-form'
import PasswordForm from './password-form'
import DangerZone from './danger-zone'

export default async function AccountPage() {
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

  const admin = createAdminClient()

  let founderData = null
  let investorData = null

  if (profile.role === 'founder') {
    const { data } = await admin
      .from('founder_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    founderData = data
  } else if (profile.role === 'investor') {
    const { data } = await admin
      .from('investor_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    investorData = data
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900">Account settings</h1>
        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
      </div>

      {/* Edit profile section */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">
          Edit profile
        </h2>
        {profile.role === 'founder' && founderData && (
          <FounderAccountForm initialData={founderData} />
        )}
        {profile.role === 'investor' && investorData && (
          <InvestorAccountForm initialData={investorData} />
        )}
        {!founderData && !investorData && (
          <p className="text-sm text-gray-500">
            No profile found. Please complete onboarding first.
          </p>
        )}
      </section>

      {/* Change password */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">
          Change password
        </h2>
        <PasswordForm />
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-base font-semibold text-red-600 border-b border-red-100 pb-3 mb-6">
          Danger zone
        </h2>
        <DangerZone role={profile.role} />
      </section>
    </div>
  )
}
