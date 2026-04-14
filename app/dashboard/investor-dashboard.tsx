/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/server'
import { fmtDate, fmtArrRange, fmtStage } from '@/lib/format'
import UnflagInvestorFlag from './unflag-investor-flag'
import AcceptDeclineFlag from './accept-decline-flag'

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

function anonFounderName(productCategories: string[] | null, location: string): string {
  const cat = productCategories?.[0] ?? 'SaaS'
  return `${cat} Company — ${location}`
}

export default async function InvestorDashboard({ userId }: Props) {
  const admin = createAdminClient()

  // Founders browsed this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: browsedThisWeek } = await admin
    .from('profile_views')
    .select('id', { count: 'exact', head: true })
    .eq('investor_id', userId)
    .gte('viewed_at', weekAgo)

  // Incoming introductions: founders who flagged this investor, pending response
  const { data: incomingFlags } = await admin
    .from('flags')
    .select('*, founder_profiles(product_categories, location, arr_range, stage, mom_growth_pct, nrr_pct, raising_amount_usd, why_now)')
    .eq('investor_id', userId)
    .eq('flagged_by', 'founder')
    .eq('status', 'pending')
    .order('created_at', { ascending: false }) as { data: any[] | null }

  // Accepted connections where founder initiated
  const { data: acceptedIncoming } = await admin
    .from('flags')
    .select('*, founder_profiles!flags_founder_id_fkey(product_categories, location, arr_range, stage, profiles(email))')
    .eq('investor_id', userId)
    .eq('flagged_by', 'founder')
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false }) as { data: any[] | null }

  // Outgoing flags: investor flagged a founder, pending
  const { data: outgoingFlags } = await admin
    .from('flags')
    .select('*, founder_profiles(product_categories, location, arr_range, stage)')
    .eq('investor_id', userId)
    .eq('flagged_by', 'investor')
    .in('status', ['pending'])
    .order('created_at', { ascending: false }) as { data: any[] | null }

  // Accepted connections where investor initiated
  const { data: acceptedOutgoing } = await admin
    .from('flags')
    .select('*, founder_profiles!flags_founder_id_fkey(product_categories, location, arr_range, stage, profiles(email))')
    .eq('investor_id', userId)
    .eq('flagged_by', 'investor')
    .eq('status', 'accepted')
    .order('responded_at', { ascending: false }) as { data: any[] | null }

  // Recently viewed founders
  const { data: recentViews } = await admin
    .from('profile_views')
    .select('*, founder_profiles(product_categories, location, arr_range, stage)')
    .eq('investor_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(5) as { data: any[] | null }

  const totalConnections = (acceptedIncoming?.length ?? 0) + (acceptedOutgoing?.length ?? 0)
  const pendingIntroductions = incomingFlags?.length ?? 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Investor Dashboard</h1>
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

      {/* Incoming founder introductions — action required */}
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
              const name = anonFounderName(fp?.product_categories, fp?.location ?? '')
              return (
                <div key={flag.id} className="border border-amber-200 bg-amber-50/30 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {fp?.stage && <span className="text-xs text-gray-600">{fmtStage(fp.stage)}</span>}
                        {fp?.arr_range && <span className="text-xs text-gray-500">{fmtArrRange(fp.arr_range)}</span>}
                        {fp?.mom_growth_pct != null && (
                          <span className="text-xs text-gray-500">{fp.mom_growth_pct}% MoM</span>
                        )}
                      </div>
                      {fp?.why_now && (
                        <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                          &ldquo;{fp.why_now}&rdquo;
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
            {[...(acceptedIncoming ?? []), ...(acceptedOutgoing ?? [])].map((flag) => {
              const fp = flag.founder_profiles
              const name = anonFounderName(fp?.product_categories, fp?.location ?? '')
              const founderEmail = (flag.founder_profiles as any)?.profiles?.email
              return (
                <div key={flag.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {fp?.stage && <span className="text-xs text-gray-500">{fmtStage(fp.stage)}</span>}
                        {fp?.arr_range && <span className="text-xs text-gray-500">{fmtArrRange(fp.arr_range)}</span>}
                      </div>
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
                const name = anonFounderName(fp?.product_categories, fp?.location ?? '')
                return (
                  <div key={flag.id} className="px-4 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {fp?.stage && <span className="text-xs text-gray-500">{fmtStage(fp.stage)}</span>}
                        {fp?.arr_range && <span className="text-xs text-gray-500">{fmtArrRange(fp.arr_range)}</span>}
                      </div>
                      <p className="text-xs text-amber-600 mt-0.5">Awaiting response</p>
                    </div>
                    <UnflagInvestorFlag founderId={flag.founder_id} />
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Recently viewed */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recently viewed</h2>
          {!recentViews || recentViews.length === 0 ? (
            <p className="text-sm text-gray-400 border border-gray-200 rounded-lg p-6 text-center">
              You haven&apos;t viewed any founder profiles yet. Start browsing in Discover.
            </p>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {recentViews.map((view, i) => {
                const fp = view.founder_profiles
                const name = anonFounderName(fp?.product_categories, fp?.location ?? '')
                return (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {fp?.stage && <span className="text-xs text-gray-500">{fmtStage(fp.stage)}</span>}
                        {fp?.arr_range && <span className="text-xs text-gray-500">{fmtArrRange(fp.arr_range)}</span>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{fmtDate(view.viewed_at)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
