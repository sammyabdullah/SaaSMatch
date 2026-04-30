/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/server'
import { fmtDate, fmtStage, fmtUsd } from '@/lib/format'
import UnflagFounderFlag from './unflag-founder-flag'
import AcceptDeclineFlag from './accept-decline-flag'
import AcceptDeclineLenderFlag from './accept-decline-lender-flag'

interface Props {
  userId: string
}

function MetricCard({
  label,
  value,
  sub,
  accent,
  children,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: 'amber' | 'green' | 'gray'
  children?: React.ReactNode
}) {
  const accentCls =
    accent === 'amber'
      ? 'text-amber-600'
      : accent === 'green'
      ? 'text-green-600'
      : 'text-gray-900'

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accentCls}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {children}
    </div>
  )
}

function InvestorNameLink({ name, website }: { name: string; website?: string | null }) {
  if (website) {
    return (
      <a
        href={website}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-[#534AB7] hover:underline"
      >
        {name}
      </a>
    )
  }
  return <p className="text-sm font-semibold text-gray-900">{name}</p>
}

export default async function FounderDashboard({ userId }: Props) {
  const admin = createAdminClient()

  // Founder profile
  const { data: founderProfile } = await admin
    .from('founder_profiles')
    .select('status, is_approved, approved_at')
    .eq('id', userId)
    .single()

  // Profile views this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: viewsThisWeek } = await admin
    .from('profile_views')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', userId)
    .gte('viewed_at', weekAgo)

  // Outgoing flags (founder flagged an investor) — pending only
  const { data: outgoingFlags, count: investorFlagsUsed } = await admin
    .from('flags')
    .select('*, investor_profiles(firm_name, partner_name, website, location)', { count: 'exact' })
    .eq('founder_id', userId)
    .eq('flagged_by', 'founder')
    .in('status', ['pending'])
    .order('created_at', { ascending: false }) as { data: any[] | null; count: number | null }

  // Pending lender flags initiated by founder (for combined limit display)
  const { count: lenderFlagsUsed } = await admin
    .from('lender_flags')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', userId)
    .eq('flagged_by', 'founder')
    .eq('status', 'pending')

  const flagsUsed = (investorFlagsUsed ?? 0) + (lenderFlagsUsed ?? 0)

  // Accepted connections where founder initiated
  const { data: acceptedOutgoing } = await admin
    .from('flags')
    .select('*, investor_profiles!flags_investor_id_fkey(firm_name, partner_name, website, location, check_size_min_usd, check_size_max_usd, stages, geography_focus, thesis_statement, profiles(email))')
    .eq('founder_id', userId)
    .eq('flagged_by', 'founder')
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false }) as { data: any[] | null }

  // Incoming investor interest — investor flagged this founder, pending acceptance
  const { data: incomingFlags } = await admin
    .from('flags')
    .select('*, investor_profiles(firm_name, partner_name, website, location, check_size_min_usd, check_size_max_usd, stages, thesis_statement)')
    .eq('founder_id', userId)
    .eq('flagged_by', 'investor')
    .eq('status', 'pending')
    .order('created_at', { ascending: false }) as { data: any[] | null }

  // Accepted connections where investor initiated (founder accepted)
  const { data: acceptedIncoming } = await admin
    .from('flags')
    .select('*, investor_profiles!flags_investor_id_fkey(firm_name, partner_name, website, location, check_size_min_usd, check_size_max_usd, stages, geography_focus, thesis_statement, profiles(email))')
    .eq('founder_id', userId)
    .eq('flagged_by', 'investor')
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false }) as { data: any[] | null }

  // Incoming lender interest — lender flagged this founder, pending acceptance
  const { data: incomingLenderFlags } = await admin
    .from('lender_flags')
    .select('*, lender_profiles(institution_name, contact_name, website, location, loan_size_min_usd, loan_size_max_usd, stages, thesis_statement)')
    .eq('founder_id', userId)
    .eq('flagged_by', 'lender')
    .eq('status', 'pending')
    .order('created_at', { ascending: false }) as { data: any[] | null }

  // Accepted lender connections where lender initiated
  const { data: acceptedLenderIncoming } = await admin
    .from('lender_flags')
    .select('*, lender_profiles!lender_flags_lender_id_fkey(institution_name, contact_name, website, location, loan_size_min_usd, loan_size_max_usd, stages, geography_focus, thesis_statement, profiles(email))')
    .eq('founder_id', userId)
    .eq('flagged_by', 'lender')
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false }) as { data: any[] | null }

  // All lender flags for activity feed (all statuses)
  const { data: allLenderFlagsForActivity } = await admin
    .from('lender_flags')
    .select('*, lender_profiles(institution_name)')
    .eq('founder_id', userId)
    .order('created_at', { ascending: false })
    .limit(20) as { data: any[] | null }

  // Profile views for activity feed — fetch investor name via separate query
  const { data: rawViews } = await admin
    .from('profile_views')
    .select('investor_id, viewed_at')
    .eq('founder_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(20)

  const investorIds = Array.from(new Set((rawViews ?? []).map((v) => v.investor_id)))
  const { data: investorNames } = investorIds.length > 0
    ? await admin.from('investor_profiles').select('id, firm_name').in('id', investorIds)
    : { data: [] }
  const investorNameMap = Object.fromEntries((investorNames ?? []).map((i) => [i.id, i.firm_name]))
  const recentViews = (rawViews ?? []).map((v) => ({
    ...v,
    firm_name: investorNameMap[v.investor_id] ?? null,
  }))

  // All outgoing flags for activity feed (all statuses)
  const { data: allOutgoingForActivity } = await admin
    .from('flags')
    .select('*, investor_profiles(firm_name)')
    .eq('founder_id', userId)
    .eq('flagged_by', 'founder')
    .order('created_at', { ascending: false })
    .limit(20) as { data: any[] | null }

  // All incoming flags for activity feed (all statuses)
  const { data: allIncomingForActivity } = await admin
    .from('flags')
    .select('*, investor_profiles(firm_name)')
    .eq('founder_id', userId)
    .eq('flagged_by', 'investor')
    .order('created_at', { ascending: false })
    .limit(20) as { data: any[] | null }

  // Profile status display
  const profileStatusValue = founderProfile?.status === 'active' ? 'Active'
    : founderProfile?.status ? fmtStage(founderProfile.status)
    : '—'

  const totalConnections = (acceptedOutgoing?.length ?? 0) + (acceptedIncoming?.length ?? 0) + (acceptedLenderIncoming?.length ?? 0)

  // Activity feed
  type ActivityItem = { date: string; text: string }
  const activity: ActivityItem[] = []

  // Profile views
  if (recentViews) {
    for (const v of recentViews) {
      const firm = v.firm_name ?? 'An investor'
      activity.push({ date: v.viewed_at, text: `${firm} viewed your profile` })
    }
  }

  // Outgoing flag events (founder initiated)
  if (allOutgoingForActivity) {
    for (const f of allOutgoingForActivity) {
      const firm = f.investor_profiles?.firm_name ?? 'An investor'
      activity.push({ date: f.created_at, text: `You flagged ${firm}` })
      if (f.status === 'accepted' && f.responded_at) {
        activity.push({ date: f.responded_at, text: `You connected with ${firm}` })
      } else if (f.status === 'declined' && f.responded_at) {
        activity.push({ date: f.responded_at, text: `${firm} declined your connection request` })
      }
    }
  }

  // Incoming flag events (investor initiated)
  if (allIncomingForActivity) {
    for (const f of allIncomingForActivity) {
      const firm = f.investor_profiles?.firm_name ?? 'An investor'
      activity.push({ date: f.created_at, text: `${firm} expressed interest in your company` })
      if (f.status === 'accepted' && f.responded_at) {
        activity.push({ date: f.responded_at, text: `You connected with ${firm}` })
      }
    }
  }

  // Lender flag events
  if (allLenderFlagsForActivity) {
    for (const f of allLenderFlagsForActivity) {
      const institution = f.lender_profiles?.institution_name ?? 'A lender'
      if (f.flagged_by === 'lender') {
        activity.push({ date: f.created_at, text: `${institution} expressed interest in lending to your company` })
        if (f.status === 'accepted' && f.responded_at) {
          activity.push({ date: f.responded_at, text: `You connected with ${institution}` })
        }
      }
    }
  }

  // Profile lifecycle events
  if (founderProfile?.approved_at) {
    activity.push({ date: founderProfile.approved_at, text: 'Your profile was approved' })
  }

  activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const recentActivity = activity.slice(0, 10)

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Founder Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Track your connections, requests, and profile activity.</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <MetricCard label="Requests sent" value={flagsUsed} />
        <MetricCard label="Connections" value={totalConnections} accent={totalConnections > 0 ? 'green' : 'gray'} />
        <MetricCard
          label="Profile status"
          value={profileStatusValue}
          accent={founderProfile?.status === 'active' ? 'green' : 'gray'}
        />
        <MetricCard label="Profile views this week" value={viewsThisWeek ?? 0} />
      </div>

      {/* Incoming investor interest — action required */}
      {incomingFlags && incomingFlags.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Investor interest
            <span className="ml-2 text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
              {incomingFlags.length} pending
            </span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            These investors have expressed interest in your company. Accept to reveal contact details.
          </p>
          <div className="space-y-3">
            {incomingFlags.map((flag) => {
              const ip = flag.investor_profiles
              return (
                <div key={flag.id} className="border border-amber-200 bg-amber-50/30 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <InvestorNameLink name={ip?.firm_name ?? '—'} website={ip?.website} />
                      <p className="text-xs text-gray-500">{ip?.partner_name ?? ''}</p>
                      {ip?.location && <p className="text-xs text-gray-400">{ip.location}</p>}
                      {ip?.check_size_min_usd && (
                        <p className="text-xs text-gray-600 mt-1">
                          {fmtUsd(ip.check_size_min_usd)} – {fmtUsd(ip.check_size_max_usd)}
                          {ip.stages?.length > 0 && ` · ${ip.stages.map(fmtStage).join(', ')}`}
                        </p>
                      )}
                      {ip?.thesis_statement && (
                        <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                          &ldquo;{ip.thesis_statement}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">Expressed interest {fmtDate(flag.created_at)}</p>
                    </div>
                    <AcceptDeclineFlag flagId={flag.id} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Incoming lender interest — action required */}
      {incomingLenderFlags && incomingLenderFlags.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Lender interest
            <span className="ml-2 text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
              {incomingLenderFlags.length} pending
            </span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            These lenders have expressed interest in your company. Accept to reveal contact details.
          </p>
          <div className="space-y-3">
            {incomingLenderFlags.map((flag) => {
              const lp = flag.lender_profiles
              return (
                <div key={flag.id} className="border border-amber-200 bg-amber-50/30 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <InvestorNameLink name={lp?.institution_name ?? '—'} website={lp?.website} />
                      <p className="text-xs text-gray-500">{lp?.contact_name ?? ''}</p>
                      {lp?.location && <p className="text-xs text-gray-400">{lp.location}</p>}
                      {lp?.loan_size_min_usd && (
                        <p className="text-xs text-gray-600 mt-1">
                          {fmtUsd(lp.loan_size_min_usd)} – {fmtUsd(lp.loan_size_max_usd)}
                          {lp.stages?.length > 0 && ` · ${lp.stages.map(fmtStage).join(', ')}`}
                        </p>
                      )}
                      {lp?.thesis_statement && (
                        <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                          &ldquo;{lp.thesis_statement}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">Expressed interest {fmtDate(flag.created_at)}</p>
                    </div>
                    <AcceptDeclineLenderFlag flagId={flag.id} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Accepted connections */}
      {totalConnections > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Your connections</h2>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {[...(acceptedOutgoing ?? []), ...(acceptedIncoming ?? [])].map((flag) => {
              const ip = flag.investor_profiles
              const investorEmail = (flag.investor_profiles as any)?.profiles?.email
              return (
                <div key={flag.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <InvestorNameLink name={ip?.firm_name ?? '—'} website={ip?.website} />
                      <p className="text-xs text-gray-500">{ip?.partner_name ?? ''}</p>
                      {ip?.location && <p className="text-xs text-gray-400">{ip.location}</p>}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        {ip?.check_size_min_usd && ip?.check_size_max_usd && (
                          <span className="text-xs text-gray-600">
                            {fmtUsd(ip.check_size_min_usd)} – {fmtUsd(ip.check_size_max_usd)}
                          </span>
                        )}
                        {ip?.stages?.length > 0 && (
                          <span className="text-xs text-gray-500">{ip.stages.map(fmtStage).join(', ')}</span>
                        )}
                      </div>
                      {ip?.geography_focus && (
                        <p className="text-xs text-gray-400 mt-0.5">{ip.geography_focus}</p>
                      )}
                      {ip?.thesis_statement && (
                        <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                          &ldquo;{ip.thesis_statement}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full shrink-0">
                      Connected
                    </span>
                  </div>
                  {investorEmail && (
                    <p className="text-sm text-[#534AB7] mt-2 font-medium">{investorEmail}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Connected {fmtDate(flag.responded_at ?? flag.created_at)}
                  </p>
                </div>
              )
            })}
            {(acceptedLenderIncoming ?? []).map((flag) => {
              const lp = flag.lender_profiles
              const lenderEmail = (flag.lender_profiles as any)?.profiles?.email
              return (
                <div key={flag.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <InvestorNameLink name={lp?.institution_name ?? '—'} website={lp?.website} />
                      <p className="text-xs text-gray-500">{lp?.contact_name ?? ''}</p>
                      {lp?.location && <p className="text-xs text-gray-400">{lp.location}</p>}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        {lp?.loan_size_min_usd && lp?.loan_size_max_usd && (
                          <span className="text-xs text-gray-600">
                            {fmtUsd(lp.loan_size_min_usd)} – {fmtUsd(lp.loan_size_max_usd)}
                          </span>
                        )}
                        {lp?.stages?.length > 0 && (
                          <span className="text-xs text-gray-500">{lp.stages.map(fmtStage).join(', ')}</span>
                        )}
                      </div>
                      {lp?.geography_focus && (
                        <p className="text-xs text-gray-400 mt-0.5">{lp.geography_focus}</p>
                      )}
                      {lp?.thesis_statement && (
                        <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                          &ldquo;{lp.thesis_statement}&rdquo;
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full shrink-0">
                      Connected
                    </span>
                  </div>
                  {lenderEmail && (
                    <p className="text-sm text-[#534AB7] mt-2 font-medium">{lenderEmail}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Connected {fmtDate(flag.responded_at ?? flag.created_at)}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Outgoing flags — pending */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Investors you&apos;ve flagged</h2>
          {!outgoingFlags || outgoingFlags.length === 0 ? (
            <p className="text-sm text-gray-400 border border-gray-200 rounded-lg p-6 text-center">
              No pending flags. Browse investors in Discover to express interest.
            </p>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {outgoingFlags.map((flag) => {
                const ip = flag.investor_profiles
                return (
                  <div key={flag.id} className="px-4 py-4 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <InvestorNameLink name={ip?.firm_name ?? '—'} website={ip?.website} />
                      <p className="text-xs text-gray-500">{ip?.partner_name ?? ''}</p>
                      {ip?.location && <p className="text-xs text-gray-400">{ip.location}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">Flagged {fmtDate(flag.created_at)}</p>
                      <p className="text-xs text-amber-600 mt-0.5">Awaiting response</p>
                    </div>
                    <UnflagFounderFlag investorId={flag.investor_id} />
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 border border-gray-200 rounded-lg p-6 text-center">
              No activity yet.
            </p>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {recentActivity.map((item, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <p className="text-sm text-gray-700">{item.text}</p>
                  <p className="text-xs text-gray-400 shrink-0 ml-3">{fmtDate(item.date)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
