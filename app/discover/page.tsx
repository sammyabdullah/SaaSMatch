import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FounderDiscoverClient from './founder-discover-client'
import InvestorDiscoverClient from './investor-discover-client'
import type {
  Database,
} from '@/lib/supabase/types'

type FounderProfileRow = Database['public']['Tables']['founder_profiles']['Row']
type InvestorProfileRow = Database['public']['Tables']['investor_profiles']['Row']

export default async function DiscoverPage() {
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

  const admin = await createAdminClient()

  if (profile.role === 'founder') {
    // Fetch approved investors
    const { data: investors } = await admin
      .from('investor_profiles')
      .select('*, profiles(email)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    // Fetch founder's own profile
    const { data: myProfile } = await admin
      .from('founder_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Fetch existing flags by this founder
    const { data: myFlags } = await admin
      .from('flags')
      .select('investor_id')
      .eq('founder_id', user.id)
      .eq('flagged_by', 'founder')

    if (!myProfile) {
      return (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500">
            Complete your profile before browsing investors.
          </p>
        </div>
      )
    }

    const myFlaggedInvestorIds = (myFlags ?? []).map((f) => f.investor_id)

    return (
      <FounderDiscoverClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        investors={(investors ?? []) as any}
        myProfile={myProfile as FounderProfileRow}
        myFlaggedInvestorIds={myFlaggedInvestorIds}
      />
    )
  }

  if (profile.role === 'investor') {
    // Fetch approved active founders
    const { data: founders } = await admin
      .from('founder_profiles')
      .select('*, profiles(email)')
      .eq('is_approved', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Fetch investor's own profile
    const { data: myProfile } = await admin
      .from('investor_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Fetch existing flags by this investor
    const { data: myFlags } = await admin
      .from('flags')
      .select('founder_id')
      .eq('investor_id', user.id)
      .eq('flagged_by', 'investor')

    if (!myProfile) {
      return (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500">
            Complete your profile before browsing founders.
          </p>
        </div>
      )
    }

    const myFlaggedFounderIds = (myFlags ?? []).map((f) => f.founder_id)

    return (
      <InvestorDiscoverClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        founders={(founders ?? []) as any}
        myProfile={myProfile as InvestorProfileRow}
        myFlaggedFounderIds={myFlaggedFounderIds}
      />
    )
  }

  // Admin or unknown
  redirect('/admin')
}
