import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FounderDiscoverClient from './founder-discover-client'
import InvestorDiscoverClient from './investor-discover-client'
import LenderDiscoverClient from './lender-discover-client'
import type {
  Database,
} from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type FounderProfileRow = Database['public']['Tables']['founder_profiles']['Row']
type InvestorProfileRow = Database['public']['Tables']['investor_profiles']['Row']
type LenderProfileRow = Database['public']['Tables']['lender_profiles']['Row']

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

  const admin = createAdminClient()

  if (profile.role === 'founder') {
    // Fetch investors, lenders, founder profile, and all flag states in parallel
    const [
      { data: investors },
      { data: lenders },
      { data: myProfile },
      { data: myInvestorFlags },
      { data: connectedInvestorFlags },
      { data: myLenderFlags },
      { data: connectedLenderFlags },
    ] = await Promise.all([
      admin.from('investor_profiles').select('*, profiles(email)').eq('is_approved', true).order('created_at', { ascending: false }),
      admin.from('lender_profiles').select('*, profiles(email)').eq('is_approved', true).order('created_at', { ascending: false }),
      admin.from('founder_profiles').select('*').eq('id', user.id).single(),
      admin.from('flags').select('investor_id').eq('founder_id', user.id).eq('flagged_by', 'founder').eq('status', 'pending'),
      admin.from('flags').select('investor_id').eq('founder_id', user.id).eq('status', 'accepted'),
      admin.from('lender_flags').select('lender_id').eq('founder_id', user.id).eq('flagged_by', 'founder').eq('status', 'pending'),
      admin.from('lender_flags').select('lender_id').eq('founder_id', user.id).eq('status', 'accepted'),
    ])

    if (!myProfile) {
      return (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500">
            Complete your profile before browsing investors.
          </p>
        </div>
      )
    }

    if (!myProfile.is_approved || myProfile.status !== 'active') {
      return (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500">
            Your profile must be approved and active before you can browse investors.
          </p>
        </div>
      )
    }

    const myFlaggedInvestorIds = (myInvestorFlags ?? []).map((f) => f.investor_id)
    const connectedInvestorIds = new Set((connectedInvestorFlags ?? []).map((f) => f.investor_id))
    const visibleInvestors = (investors ?? []).filter((i) => !connectedInvestorIds.has(i.id))

    const myFlaggedLenderIds = (myLenderFlags ?? []).map((f) => f.lender_id)
    const connectedLenderIds = new Set((connectedLenderFlags ?? []).map((f) => f.lender_id))
    const visibleLenders = (lenders ?? []).filter((l) => !connectedLenderIds.has(l.id))

    return (
      <FounderDiscoverClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        investors={visibleInvestors as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lenders={visibleLenders as any}
        myProfile={myProfile as FounderProfileRow}
        myFlaggedInvestorIds={myFlaggedInvestorIds}
        myFlaggedLenderIds={myFlaggedLenderIds}
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

    // Fetch pending flags by this investor (for "Flagged ✓" state)
    const { data: myFlags } = await admin
      .from('flags')
      .select('founder_id')
      .eq('investor_id', user.id)
      .eq('flagged_by', 'investor')
      .eq('status', 'pending')

    // Fetch connected founder IDs (accepted flags, either direction)
    const { data: connectedFounderFlags } = await admin
      .from('flags')
      .select('founder_id')
      .eq('investor_id', user.id)
      .eq('status', 'accepted')

    if (!myProfile) {
      return (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500">
            Complete your profile before browsing founders.
          </p>
        </div>
      )
    }

    if (!myProfile.is_approved) {
      return (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500">
            Your profile must be approved before you can browse founders.
          </p>
        </div>
      )
    }

    const myFlaggedFounderIds = (myFlags ?? []).map((f) => f.founder_id)
    const connectedFounderIds = new Set((connectedFounderFlags ?? []).map((f) => f.founder_id))
    const visibleFounders = (founders ?? []).filter((f) => !connectedFounderIds.has(f.id))

    return (
      <InvestorDiscoverClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        founders={visibleFounders as any}
        myProfile={myProfile as InvestorProfileRow}
        myFlaggedFounderIds={myFlaggedFounderIds}
      />
    )
  }

  if (profile.role === 'lender') {
    // Fetch approved active founders
    const { data: founders } = await admin
      .from('founder_profiles')
      .select('*, profiles(email)')
      .eq('is_approved', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Fetch lender's own profile
    const { data: myProfile } = await admin
      .from('lender_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Fetch pending flags by this lender
    const { data: myFlags } = await admin
      .from('lender_flags')
      .select('founder_id')
      .eq('lender_id', user.id)
      .eq('flagged_by', 'lender')
      .eq('status', 'pending')

    // Fetch connected founder IDs (accepted flags)
    const { data: connectedFounderFlags } = await admin
      .from('lender_flags')
      .select('founder_id')
      .eq('lender_id', user.id)
      .eq('status', 'accepted')

    if (!myProfile) {
      return (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500">
            Complete your profile before browsing founders.
          </p>
        </div>
      )
    }

    if (!myProfile.is_approved) {
      return (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500">
            Your profile must be approved before you can browse founders.
          </p>
        </div>
      )
    }

    const myFlaggedFounderIds = (myFlags ?? []).map((f) => f.founder_id)
    const connectedFounderIds = new Set((connectedFounderFlags ?? []).map((f) => f.founder_id))
    const visibleFounders = (founders ?? []).filter((f) => !connectedFounderIds.has(f.id))

    return (
      <LenderDiscoverClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        founders={visibleFounders as any}
        myProfile={myProfile as LenderProfileRow}
        myFlaggedFounderIds={myFlaggedFounderIds}
      />
    )
  }

  // Admin or unknown
  redirect('/admin')
}
