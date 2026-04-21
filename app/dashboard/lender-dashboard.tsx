/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/server'
import { fmtDate, fmtArrRange, fmtStage } from '@/lib/format'
import UnflagLenderFlag from './unflag-lender-flag'
import AcceptDeclineLenderFlag from './accept-decline-lender-flag'

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

function FounderNameLink({ name, website }: { name: string; website?: string | null }) {
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

export default async function LenderDashboard({ userId }: Props) {
  const admin = createAdminClient()

  // Founders browsed this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: browsedThisWeek } = await admin
    .from('profile_views')
    .select('id', { count: 'exact', head: true })
    .eq('investor_id', userId)
    .gte('viewed_at', weekAgo)

  // Incoming flags: founders who flagged this lender, pending response
  const { data: incomingFlags } = await admin
    .from('lender_flags')
    .select('*, founder_profiles(company_name, website, product_categories, location, arr_range, stage, mom_growth_pct, raising_amount_usd, why_now)')
    .eq('lender_id', userId)
    .eq('flagged_by', 'founder')
    .eq('status', 'pending')
    .order('created_at', { ascending: false }) as { data: any[] | null }

  // Accepted connections where founder initiated
  const { data: acceptedIncoming } = await admin
    .from('lender_flags')
    .select('*, founder_profiles!lender_flags_founder_id_fkey(company_name, website, product_categories, location, arr_range, stage, mom_growth_pct, profiles(email))')
    .eq('lender_id', userId)
    .eq('flagged_by', 'founder')
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false }) as { data: any[] | null }

  // Outgoing flags: lender flagged a founder, pending
  const { data: outgoingFlags } = await admin
    .from('lender_flags')
    .select('*, founder_profiles(company_name, website, product_categories, location, arr_range, stage, mom_growth_pct)')
    .eq('lender_id', userId)
    .eq('flagged_by', 'lender')
    .in('status', ['pending'])
    .order('created_at', { ascending: false }) as { data: any[] | null }

  // Accepted connections where lender initiated
  const { data: acceptedOutgoing } = await admin
    .from('lender_flags')
    .select('*, founder_profiles!lender_flags_founder_id_fkey(company_name, website, product_categories, location, arr_range, stage, mom_growth_pct, profiles(email))')
    .eq('lender_id', userId)
    .eq('flagged_by', 'lender')
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false }) as { data: any[] | null }

  // All outgoing flags for activity feed (all statuses)
  const { data: allOutgoingForActivity } = await admin
    .from('lender_flags')
    .select('*, founder_profiles(company_name)')
    .eq('lender_id', userId)
    .eq('flagged_by', 'lender')
    .order('created_at', { ascending: false })
    .limit(20) as { data: any[] | null }

  // All incoming flags for activity feed (all statuses)
  const { data: allIncomingForActivity } = await admin
    .from('lender_flags')
    .select('*, founder_profiles(company_name)')
    .eq('lender_id', userId)
    .eq('flagged_by', 'founder')
    .order('created_at', { ascending: false })
    .limit(20) as { data: any[] | null }

  const totalConnections = (acceptedIncoming?.length ?? 0) + (acceptedOutgoing?.length ?? 0)
  const pendingIntroductions = incomingFlags?.length ?? 0

  // Activity feed
  type ActivityItem = { date: string; text: string }
  const activity: ActivityItem[] = []

  if (allOutgoingForActivity) {
    for (const f of allOutgoingForActivity) {
      const company = f.founder_profiles?.company_name ?? 'A founder'
      activity.push({ date: f.created_at, text: `You sent a connection request to ${company}` })
      if (f.status === 'accepted' && f.responded_at) {
        activity.push({ date: f.responded_at, text: `You connected with ${company}` })
      } else if (f.status === 'declined' && f.responded_at) {
        activity.push({ date: f.responded_at, text: `${company} declined your connection request` })
      }
    }
  }

  if (allIncomingForActivity) {
    for (const f of allIncomingForActivity) {
      const company = f.founder_profiles?.company_name ?? 'A founder'
      activity.push({ date: f.created_at, text: `${company} expressed interest in connecting` })
      if (f.status === 'accepted' && f.responded_at) {
        activity.push({ date: f.responded_at, text: `You connected with ${company}` })
      }
    }
  }

  activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const recentActivity = activity.slice(0, 10)

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Lender Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Track your connections, introductions, and activity.</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <MetricCard label="Founders browsed this week" value={browsedThisWeek ?? 0} />
        <MetricCard label="Connections" value={totalConnections} accent={totalConnections > 0 ? 'green' : 'gray'} />
        <MetricCard
          label="Pending intros"
          value={pendingIntroductions}
          accent={pendingIntroductions > 0 ? 'amber' : 'gray'}
        />
      </div>

      {/* Incoming founder introductions */}
      {incomingFlags && incomingFlags.length > 0 && (
        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Founder introductions
            <span className="ml-2 text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
              {incomingFlags.length} pending
            </span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            These founders have expressed interest in connecting with you. Accept to reveal their contact details.
          </p>
          <div className="space-y-3">
            {incomingFlags.map((flag) => {
              const fp = flag.founder_profiles
              return (
                <div key={flag.id} className="border border-amber-200 bg-amber-50/30 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <FounderNameLink name={fp?.company_name ?? 'Unknown company'} website={fp?.website} />
                      {fp?.location && <p className="text-xs text-gray-500 mt-0.5">{fp.location}</p>}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        {fp?.stage && <span className="text-xs text-gray-600">{fmtStage(fp.stage)}</span>}
                        {fp?.arr_range && <span className="text-xs text-gray-500">{fmtArrRange(fp.arr_range)}</span>}
                        {fp?.mom_growth_pct != null && (
                          <span className="text-xs text-gray-500">{fp.mom_growth_pct}% YOY</span>
                        )}
                      </div>
                      {fp?.product_categories?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">{fp.product_categories.join(' · ')}</p>
                      )}
                      {fp?.why_now && (
                        <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                          &ldquo;{fp.why_now}&rdquo;
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
            {[...(acceptedIncoming ?? []), ...(acceptedOutgoing ?? [])].map((flag) => {
              const fp = flag.founder_profiles
              const founderEmail = (flag.founder_profiles as any)?.profiles?.email
              return (
                <div key={flag.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <FounderNameLink name={fp?.company_name ?? 'Unknown company'} website={fp?.website} />
                      {fp?.location && <p className="text-xs text-gray-500 mt-0.5">{fp.location}</p>}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        {fp?.stage && <span className="text-xs text-gray-500">{fmtStage(fp.stage)}</span>}
                        {fp?.arr_range && <span className="text-xs text-gray-500">{fmtArrRange(fp.arr_range)}</span>}
                        {fp?.mom_growth_pct != null && (
                          <span className="text-xs text-gray-500">{fp.mom_growth_pct}% YOY</span>
                        )}
                      </div>
                      {fp?.product_categories?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">{fp.product_categories.join(' · ')}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                  </div>
                  {founderEmail && (
                    <p className="text-sm text-[#534AB7] mt-2 font-medium">{founderEmail}</p>
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
        {/* Outgoing flags to founders */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Founders you&apos;ve flagged</h2>
          {!outgoingFlags || outgoingFlags.length === 0 ? (
            <p className="text-sm text-gray-400 border border-gray-200 rounded-lg p-6 text-center">
              You haven&apos;t expressed interest in any founders yet. Browse founders in Discover.
            </p>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {outgoingFlags.map((flag) => {
                const fp = flag.founder_profiles
                return (
                  <div key={flag.id} className="px-4 py-4 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <FounderNameLink name={fp?.company_name ?? 'Unknown company'} website={fp?.website} />
                      {fp?.location && <p className="text-xs text-gray-500 mt-0.5">{fp.location}</p>}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        {fp?.stage && <span className="text-xs text-gray-500">{fmtStage(fp.stage)}</span>}
                        {fp?.arr_range && <span className="text-xs text-gray-500">{fmtArrRange(fp.arr_range)}</span>}
                      </div>
                      {fp?.product_categories?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">{fp.product_categories.join(' · ')}</p>
                      )}
                      <p className="text-xs text-amber-600 mt-1">Awaiting response</p>
                    </div>
                    <UnflagLenderFlag founderId={flag.founder_id} />
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
