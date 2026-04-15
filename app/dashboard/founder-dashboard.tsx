/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/server'
import { fmtDate, fmtStage, fmtUsd, daysUntil } from '@/lib/format'
import UnflagFounderFlag from './unflag-founder-flag'
import AcceptDeclineFlag from './accept-decline-flag'
import RestartClockButton from './restart-clock-button'

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

export default async function FounderDashboard({ userId }: Props) {
  const admin = createAdminClient()

  // Founder profile
  const { data: founderProfile } = await admin
    .from('founder_profiles')
    .select('status, profile_expires_at')
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
  const { data: outgoingFlags, count: flagsUsed } = await admin
    .from('flags')
    .select('*, investor_profiles(firm_name, partner_name)', { count: 'exact' })
    .eq('founder_id', userId)
    .eq('flagged_by', 'founder')
    .in('status', ['pending'])
    .order('created_at', { ascending: false }) as { data: any[] | null; count: number | null }

  // Accepted connections where founder initiated
  const { data: acceptedOutgoing } = await admin
    .from('flags')
    .select('*, investor_profiles!flags_investor_id_fkey(firm_name, partner_name, profiles(email))')
    .eq('founder_id', userId)
    .eq('flagged_by', 'founder')
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false }) as { data: any[] | null }

  // Incoming investor interest — investor flagged this founder, pending acceptance
  const { data: incomingFlags } = await admin
    .from('flags')
    .select('*, investor_profiles(firm_name, partner_name, website, check_size_min_usd, check_size_max_usd, stages, thesis_statement)')
    .eq('founder_id', userId)
    .eq('flagged_by', 'investor')
    .eq('status', 'pending')
    .order('created_at', { ascending: false }) as { data: any[] | null }

  // Accepted connections where investor initiated (founder accepted)
  const { data: acceptedIncoming } = await admin
    .from('flags')
    .select('*, investor_profiles!flags_investor_id_fkey(firm_name, partner_name, profiles(email))')
    .eq('founder_id', userId)
    .eq('flagged_by', 'investor')
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false }) as { data: any[] | null }

  // Profile views for activity feed
  const { data: recentViews } = await admin
    .from('profile_views')
    .select('*, investor_profiles(firm_name)')
    .eq('founder_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(10) as { data: any[] | null }

  // Profile status display
  let profileStatusValue = founderProfile?.status ?? '—'
  let profileStatusSub: string | undefined
  if (founderProfile?.status === 'active' && founderProfile.profile_expires_at) {
    const days = daysUntil(founderProfile.profile_expires_at)
    profileStatusSub = days > 0 ? `${days} days remaining` : 'Expires today'
    profileStatusValue = 'Active'
  } else if (founderProfile?.status) {
    profileStatusValue = fmtStage(founderProfile.status)
  }

  const totalConnections = (acceptedOutgoing?.length ?? 0) + (acceptedIncoming?.length ?? 0)

  // Activity feed
  type ActivityItem = { date: string; text: string }
  const activity: ActivityItem[] = []
  if (recentViews) {
    for (const v of recentViews) {
      const firm = v.investor_profiles?.firm_name ?? 'An investor'
      activity.push({ date: v.viewed_at, text: `${firm} viewed your profile` })
    }
  }
  activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const recentActivity = activity.slice(0, 10)

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Founder Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Track your connections, flags, and profile activity.</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <MetricCard label="Flags sent" value={`${flagsUsed ?? 0} / 10`} />
        <MetricCard label="Connections" value={totalConnections} accent={totalConnections > 0 ? 'green' : 'gray'} />
        <MetricCard
          label="Profile status"
          value={profileStatusValue}
          sub={profileStatusSub}
          accent={founderProfile?.status === 'active' ? 'green' : 'gray'}
        >
          {(founderProfile?.status === 'active' || founderProfile?.status === 'expired') && (
            <RestartClockButton />
          )}
        </MetricCard>
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
                      {ip?.website ? (
                        <a
                          href={ip.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#534AB7] hover:underline"
                        >
                          {ip.firm_name}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">{ip?.firm_name ?? '—'}</p>
                      )}
                      <p className="text-xs text-gray-500">{ip?.partner_name ?? ''}</p>
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
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{ip?.firm_name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{ip?.partner_name ?? ''}</p>
                    </div>
                    <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
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
              {outgoingFlags.map((flag) => (
                <div key={flag.id} className="px-4 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {flag.investor_profiles?.firm_name ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {flag.investor_profiles?.partner_name ?? ''} &middot; Flagged {fmtDate(flag.created_at)}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">Awaiting response</p>
                  </div>
                  <UnflagFounderFlag investorId={flag.investor_id} />
                </div>
              ))}
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
