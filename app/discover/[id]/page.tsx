/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmtUsd, fmtArrRange, fmtStage, fmtDate } from '@/lib/format'
import { ViewLogger } from './view-logger'
import FlagActionButton from './flag-action-button'

interface Props {
  params: Promise<{ id: string }>
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  )
}

export default async function ProfileDetailPage({ params }: Props) {
  const { id } = await params

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

  if (profile.role === 'investor') {
    // Investor viewing a founder profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fp } = await admin
      .from('founder_profiles')
      .select('*, profiles(email)')
      .eq('id', id)
      .single() as { data: any }

    if (!fp) {
      return (
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500">Profile not found.</p>
        </div>
      )
    }

    // Check if already flagged
    const { data: existingFlag } = await admin
      .from('flags')
      .select('id')
      .eq('investor_id', user.id)
      .eq('founder_id', id)
      .eq('flagged_by', 'investor')
      .maybeSingle()

    // Count investor's existing flags to check limit
    const { count: flagCount } = await admin
      .from('flags')
      .select('id', { count: 'exact', head: true })
      .eq('investor_id', user.id)
      .eq('flagged_by', 'investor')

    const isAlreadyFlagged = !!existingFlag
    const displayName = `${fp.product_categories?.[0] ?? 'SaaS'} Company — ${fp.location}`

    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <ViewLogger founderId={id} />

        <BackButton />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{displayName}</h1>
          <p className="text-sm text-gray-400 mt-1">Profile ID: {id}</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
            Company details
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            <Field label="Location" value={fp.location} />
            <Field label="Founded" value={String(fp.founded_year)} />
            <Field label="Stage" value={fmtStage(fp.stage)} />
            <Field label="ARR range" value={fmtArrRange(fp.arr_range)} />
            {fp.mom_growth_pct != null && <Field label="YOY growth" value={`${fp.mom_growth_pct}%`} />}
            <Field
              label="GTM motion"
              value={fp.gtm_motion.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
            />
            <Field
              label="Revenue model"
              value={fp.revenue_model.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
            />
            <Field label="Total raise" value={fmtUsd(fp.raising_amount_usd)} />
            {fp.website && <Field label="Website" value={fp.website} />}
          </div>
        </div>

        {fp.product_categories?.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
              Product categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {fp.product_categories.map((c: string) => (
                <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {fp.why_now && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
              In their own words
            </h2>
            <p className="text-sm text-gray-700 italic">&ldquo;{fp.why_now}&rdquo;</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 mb-8">
          <span>Listed {fmtDate(fp.created_at)}</span>
        </div>

        <FlagActionButton
          targetId={id}
          mode="investor-flagging-founder"
          isAlreadyFlagged={isAlreadyFlagged}
          flagCount={flagCount ?? 0}
        />
      </div>
    )
  }

  if (profile.role === 'founder') {
    // Founder viewing an investor profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ip } = await admin
      .from('investor_profiles')
      .select('*, profiles(email)')
      .eq('id', id)
      .single() as { data: any }

    if (!ip) {
      return (
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500">Profile not found.</p>
        </div>
      )
    }

    // Check if already flagged
    const { data: existingFlag } = await admin
      .from('flags')
      .select('id')
      .eq('founder_id', user.id)
      .eq('investor_id', id)
      .eq('flagged_by', 'founder')
      .maybeSingle()

    const { count: flagCount } = await admin
      .from('flags')
      .select('id', { count: 'exact', head: true })
      .eq('founder_id', user.id)
      .eq('flagged_by', 'founder')

    const isAlreadyFlagged = !!existingFlag

    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <BackButton />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{ip.firm_name}</h1>
          <p className="text-sm text-gray-600 mt-0.5">{ip.partner_name}</p>
          <p className="text-sm text-gray-400">{ip.location}</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
            Investment parameters
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            <Field
              label="Check size"
              value={`${fmtUsd(ip.check_size_min_usd)} – ${fmtUsd(ip.check_size_max_usd)}`}
            />
            <Field
              label="ARR sweet spot"
              value={`${fmtUsd(ip.arr_sweet_spot_min)} – ${fmtUsd(ip.arr_sweet_spot_max)}`}
            />
            <Field label="Leads rounds" value={ip.leads_rounds ? 'Yes' : 'No'} />
            <Field label="Takes board seat" value={ip.takes_board_seat ? 'Yes' : 'No'} />
            <Field label="Geography focus" value={ip.geography_focus} />
            {ip.portfolio_count > 0 && (
              <Field label="Portfolio companies" value={String(ip.portfolio_count)} />
            )}
          </div>
        </div>

        {ip.stages?.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
              Stages
            </h2>
            <div className="flex flex-wrap gap-2">
              {ip.stages.map((s: string) => (
                <span key={s} className="text-xs bg-purple-50 text-[#534AB7] px-2.5 py-1 rounded-full">
                  {fmtStage(s)}
                </span>
              ))}
            </div>
          </div>
        )}

        {ip.saas_subcategories?.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
              SaaS focus areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {ip.saas_subcategories.map((c: string) => (
                <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {ip.thesis_statement && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
              Thesis
            </h2>
            <p className="text-sm text-gray-700 italic">&ldquo;{ip.thesis_statement}&rdquo;</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 mb-8">
          <span>Listed {fmtDate(ip.created_at)}</span>
        </div>

        <FlagActionButton
          targetId={id}
          mode="founder-flagging-investor"
          isAlreadyFlagged={isAlreadyFlagged}
          flagCount={flagCount ?? 0}
        />
      </div>
    )
  }

  redirect('/dashboard')
}

function BackButton() {
  return (
    <div className="mb-6">
      <BackButtonClient />
    </div>
  )
}

function BackButtonClient() {
  // Rendered as a link to /discover for SSR-safe back navigation
  return (
    <a
      href="/discover"
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Discover
    </a>
  )
}
