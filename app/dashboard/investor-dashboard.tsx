/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/server'
import { fmtDate, fmtArrRange, fmtStage, daysUntil } from '@/lib/format'
import MarkRespondedButton from './mark-responded-button'
import UnflagInvestorFlag from './unflag-investor-flag'

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

function anonFounderName(
  productCategories: string[] | null,
  location: string
): string {
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

  // Active matches
  const { count: activeMatchCount } = await admin
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('investor_id', userId)
    .eq('status', 'active')

  // Response rate
  const { count: totalMatches } = await admin
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('investor_id', userId)

  const { count: respondedMatches } = await admin
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('investor_id', userId)
    .not('investor_responded_at', 'is', null)

  const responseRate =
    totalMatches && totalMatches > 0
      ? `${Math.round(((respondedMatches ?? 0) / totalMatches) * 100)}%`
      : '—'

  // Warnings
  const { count: warningCount } = await admin
    .from('investor_warnings')
    .select('id', { count: 'exact', head: true })
    .eq('investor_id', userId)
    .is('resolved_at', null)

  // Matches with founder info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: matches } = await admin
    .from('matches')
    .select('*, founder_profiles(company_name, arr_range, stage, product_categories, location), profiles!matches_founder_id_fkey(email)')
    .eq('investor_id', userId)
    .order('matched_at', { ascending: false }) as { data: any[] | null }

  // Flags placed on founders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: myFlags } = await admin
    .from('flags')
    .select('*, founder_profiles(product_categories, location, arr_range, stage)')
    .eq('investor_id', userId)
    .eq('flagged_by', 'investor')
    .order('created_at', { ascending: false }) as { data: any[] | null }

  // Recently viewed founders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentViews } = await admin
    .from('profile_views')
    .select('*, founder_profiles(product_categories, location, arr_range, stage)')
    .eq('investor_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(5) as { data: any[] | null }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Investor Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Track your matches, expressed interest, and activity.</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <MetricCard label="Founders browsed this week" value={browsedThisWeek ?? 0} />
        <MetricCard label="Active matches" value={activeMatchCount ?? 0} />
        <MetricCard label="Response rate" value={responseRate} />
        <MetricCard
          label="Warnings"
          value={warningCount ?? 0}
          accent={(warningCount ?? 0) > 0 ? 'amber' : 'gray'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Matches */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Your matches</h2>
          {!matches || matches.length === 0 ? (
            <p className="text-sm text-gray-400 border border-gray-200 rounded-lg p-6 text-center">
              No matches yet.
            </p>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => {
                const fp = m.founder_profiles
                const deadlineDays = daysUntil(m.response_deadline)
                const canRespond = m.status === 'active' && !m.investor_responded_at
                return (
                  <div key={m.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {fp?.company_name ?? '—'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {fp?.stage && (
                            <span className="text-xs text-gray-500">{fmtStage(fp.stage)}</span>
                          )}
                          {fp?.arr_range && (
                            <span className="text-xs text-gray-500">{fmtArrRange(fp.arr_range)}</span>
                          )}
                        </div>
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
                    {canRespond && (
                      <div className="mt-3">
                        <MarkRespondedButton matchId={m.id} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Founders flagged */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Founders you&apos;ve flagged</h2>
          {!myFlags || myFlags.length === 0 ? (
            <p className="text-sm text-gray-400 border border-gray-200 rounded-lg p-6 text-center">
              You haven&apos;t expressed interest in any founders yet. Browse founders in Discover.
            </p>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {myFlags.map((flag) => {
                const fp = flag.founder_profiles
                const name = anonFounderName(fp?.product_categories, fp?.location ?? '')
                return (
                  <div key={flag.id} className="px-4 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {fp?.stage && (
                          <span className="text-xs text-gray-500">{fmtStage(fp.stage)}</span>
                        )}
                        {fp?.arr_range && (
                          <span className="text-xs text-gray-500">{fmtArrRange(fp.arr_range)}</span>
                        )}
                        <span className="text-xs text-gray-400">{fmtDate(flag.created_at)}</span>
                      </div>
                    </div>
                    <UnflagInvestorFlag founderId={flag.founder_id} />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

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
                      {fp?.stage && (
                        <span className="text-xs text-gray-500">{fmtStage(fp.stage)}</span>
                      )}
                      {fp?.arr_range && (
                        <span className="text-xs text-gray-500">{fmtArrRange(fp.arr_range)}</span>
                      )}
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
  )
}
