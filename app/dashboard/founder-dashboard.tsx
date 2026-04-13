/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/server'
import { fmtDate, daysUntil, fmtStage } from '@/lib/format'
import UnflagFounderFlag from './unflag-founder-flag'

interface Props {
  userId: string
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: 'amber' | 'green' | 'gray'
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
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active'
      ? 'bg-amber-50 text-amber-700'
      : status === 'responded'
      ? 'bg-green-50 text-green-700'
      : 'bg-gray-100 text-gray-500'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default async function FounderDashboard({ userId }: Props) {
  const admin = await createAdminClient()

  // Flags used (founder flagging investors)
  const { count: flagsUsed } = await admin
    .from('flags')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', userId)
    .eq('flagged_by', 'founder')

  // Active matches
  const { count: activeMatchCount } = await admin
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', userId)
    .eq('status', 'active')

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

  // Matches with investor info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches } = await admin
    .from('matches')
    .select('*, investor_profiles(firm_name, partner_name), profiles!matches_investor_id_fkey(email)')
    .eq('founder_id', userId)
    .order('matched_at', { ascending: false }) as { data: any[] | null }

  // Profile views for activity feed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentViews } = await admin
    .from('profile_views')
    .select('*, investor_profiles(firm_name)')
    .eq('founder_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(10) as { data: any[] | null }

  // Flags the founder has placed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: myFlags } = await admin
    .from('flags')
    .select('*, investor_profiles(firm_name, partner_name)')
    .eq('founder_id', userId)
    .eq('flagged_by', 'founder')
    .order('created_at', { ascending: false }) as { data: any[] | null }

  // Build activity feed
  type ActivityItem = { date: string; text: string }
  const activity: ActivityItem[] = []

  if (recentViews) {
    for (const v of recentViews) {
      const firm = v.investor_profiles?.firm_name ?? 'An investor'
      activity.push({ date: v.viewed_at, text: `${firm} viewed your profile` })
    }
  }
  if (matches) {
    for (const m of matches) {
      const firm = m.investor_profiles?.firm_name ?? 'An investor'
      activity.push({ date: m.matched_at, text: `New match with ${firm}` })
    }
  }
  activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const recentActivity = activity.slice(0, 10)

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* TEMP DEBUG — remove after fix */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono break-all">
        <p><strong>userId (querying with):</strong> {userId}</p>
        <p><strong>flagsUsed count:</strong> {flagsUsed ?? 'null'}</p>
        <p><strong>myFlags rows:</strong> {myFlags?.length ?? 'null'}</p>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Founder Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Track your matches, flags, and profile activity.</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <MetricCard label="Flags used" value={`${flagsUsed ?? 0} / 10`} />
        <MetricCard label="Active matches" value={activeMatchCount ?? 0} />
        <MetricCard
          label="Profile status"
          value={profileStatusValue}
          sub={profileStatusSub}
          accent={founderProfile?.status === 'active' ? 'green' : 'gray'}
        />
        <MetricCard label="Profile views this week" value={viewsThisWeek ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Matches */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Your matches</h2>
          {!matches || matches.length === 0 ? (
            <p className="text-sm text-gray-400 border border-gray-200 rounded-lg p-6 text-center">
              No matches yet. Complete your profile to get matched with investors.
            </p>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => {
                const deadlineDays = daysUntil(m.response_deadline)
                return (
                  <div key={m.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {m.investor_profiles?.firm_name ?? '—'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {m.investor_profiles?.partner_name ?? ''}
                        </p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-xs text-gray-400">
                      Matched {fmtDate(m.matched_at)}
                    </p>
                    <p className={`text-xs mt-1 ${deadlineDays < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                      {deadlineDays < 0
                        ? 'Overdue'
                        : `Response deadline: ${deadlineDays}d remaining`}
                    </p>
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

      {/* Your flags */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Investors you&apos;ve flagged
        </h2>
        {!myFlags || myFlags.length === 0 ? (
          <p className="text-sm text-gray-400 border border-gray-200 rounded-lg p-6 text-center">
            You haven&apos;t flagged any investors yet. Browse investors in Discover to express interest.
          </p>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            {myFlags.map((flag) => (
              <div key={flag.id} className="px-4 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {flag.investor_profiles?.firm_name ?? '—'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {flag.investor_profiles?.partner_name ?? ''} &middot; Flagged {fmtDate(flag.created_at)}
                  </p>
                </div>
                <UnflagFounderFlag investorId={flag.investor_id} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
