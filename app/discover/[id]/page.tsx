/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmtUsd, fmtArrRange, fmtStage, fmtDate } from '@/lib/format'
import { ViewLogger } from './view-logger'
import { InvestorViewLogger } from './investor-view-logger'
import { LenderViewLogger } from './lender-view-logger'
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

    // Check if already flagged (exclude declined so user can re-flag)
    const { data: existingFlag } = await admin
      .from('flags')
      .select('id')
      .eq('investor_id', user.id)
      .eq('founder_id', id)
      .eq('flagged_by', 'investor')
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

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
              In their own words and traction
            </h2>
            <p className="text-sm text-gray-700 italic">&ldquo;{fp.why_now}&rdquo;</p>
          </div>
        )}

        {fp.deck_url && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
              Pitch deck
            </h2>
            <a
              href={fp.deck_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#534AB7] hover:underline font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              View pitch deck ↗
            </a>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 mb-8">
          <span>Listed {fmtDate(fp.created_at)}</span>
        </div>

        <FlagActionButton
          targetId={id}
          mode="investor-flagging-founder"
          isAlreadyFlagged={isAlreadyFlagged}
        />
      </div>
    )
  }

  if (profile.role === 'founder') {
    // Try investor profile first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ip } = await admin
      .from('investor_profiles')
      .select('*, profiles(email)')
      .eq('id', id)
      .single() as { data: any }

    if (!ip) {
      // Try lender profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: lp } = await admin
        .from('lender_profiles')
        .select('*, profiles(email)')
        .eq('id', id)
        .single() as { data: any }

      if (!lp) {
        return (
          <div className="max-w-3xl mx-auto px-6 py-12">
            <p className="text-sm text-gray-500">Profile not found.</p>
          </div>
        )
      }

      const { data: existingLenderFlag } = await admin
        .from('lender_flags')
        .select('id')
        .eq('founder_id', user.id)
        .eq('lender_id', id)
        .eq('flagged_by', 'founder')
        .in('status', ['pending', 'accepted'])
        .maybeSingle()

      return (
        <div className="max-w-3xl mx-auto px-6 py-12">
          <LenderViewLogger lenderId={id} />
          <BackButton />

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-semibold text-gray-900">{lp.institution_name}</h1>
              <span className="text-xs font-medium bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-full">Lender</span>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{lp.contact_name}</p>
            <p className="text-sm text-gray-400">{lp.location}</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Lending parameters</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Loan size" value={`${fmtUsd(lp.loan_size_min_usd)} – ${fmtUsd(lp.loan_size_max_usd)}`} />
              <Field label="Geography focus" value={lp.geography_focus} />
              {lp.arr_min_requirement > 0 && <Field label="Min ARR requirement" value={fmtUsd(lp.arr_min_requirement)} />}
              {lp.arr_max_sweet_spot > 0 && <Field label="ARR sweet spot" value={`up to ${fmtUsd(lp.arr_max_sweet_spot)}`} />}
              {lp.website && <Field label="Website" value={lp.website} />}
            </div>
          </div>

          {lp.stages?.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Stages</h2>
              <div className="flex flex-wrap gap-2">
                {lp.stages.map((s: string) => (
                  <span key={s} className="text-xs bg-purple-50 text-[#534AB7] px-2.5 py-1 rounded-full">{fmtStage(s)}</span>
                ))}
              </div>
            </div>
          )}

          {lp.saas_subcategories?.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">SaaS focus areas</h2>
              <div className="flex flex-wrap gap-2">
                {lp.saas_subcategories.map((c: string) => (
                  <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          )}

          {lp.thesis_statement && (
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Thesis</h2>
              <p className="text-sm text-gray-700 italic">&ldquo;{lp.thesis_statement}&rdquo;</p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-400 mb-8">
            <span>Listed {fmtDate(lp.created_at)}</span>
          </div>

          <FlagActionButton targetId={id} mode="founder-flagging-lender" isAlreadyFlagged={!!existingLenderFlag} />
        </div>
      )
    }

    // Investor profile — check if already flagged (exclude declined so user can re-flag)
    const { data: existingFlag } = await admin
      .from('flags')
      .select('id')
      .eq('founder_id', user.id)
      .eq('investor_id', id)
      .eq('flagged_by', 'founder')
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    const isAlreadyFlagged = !!existingFlag

    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <InvestorViewLogger investorId={id} />
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
            <Field label="Geography focus" value={ip.geography_focus} />
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
        />
      </div>
    )
  }

  if (profile.role === 'lender') {
    // Lender viewing a founder profile
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

    const { data: existingFlag } = await admin
      .from('lender_flags')
      .select('id')
      .eq('lender_id', user.id)
      .eq('founder_id', id)
      .eq('flagged_by', 'lender')
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    const isAlreadyFlagged = !!existingFlag
    const displayName = `${fp.product_categories?.[0] ?? 'SaaS'} Company — ${fp.location}`

    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <BackButton />

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{displayName}</h1>
          <p className="text-sm text-gray-400 mt-1">Profile ID: {id}</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Company details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            <Field label="Location" value={fp.location} />
            <Field label="Founded" value={String(fp.founded_year)} />
            <Field label="Stage" value={fmtStage(fp.stage)} />
            <Field label="ARR range" value={fmtArrRange(fp.arr_range)} />
            {fp.mom_growth_pct != null && <Field label="YOY growth" value={`${fp.mom_growth_pct}%`} />}
            <Field label="GTM motion" value={fp.gtm_motion.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} />
            <Field label="Revenue model" value={fp.revenue_model.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} />
            <Field label="Total raise" value={fmtUsd(fp.raising_amount_usd)} />
            {fp.website && <Field label="Website" value={fp.website} />}
          </div>
        </div>

        {fp.product_categories?.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Product categories</h2>
            <div className="flex flex-wrap gap-2">
              {fp.product_categories.map((c: string) => (
                <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{c}</span>
              ))}
            </div>
          </div>
        )}

        {fp.why_now && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">In their own words and traction</h2>
            <p className="text-sm text-gray-700 italic">&ldquo;{fp.why_now}&rdquo;</p>
          </div>
        )}

        {fp.deck_url && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Pitch deck</h2>
            <a
              href={fp.deck_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#534AB7] hover:underline font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              View pitch deck ↗
            </a>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 mb-8">
          <span>Listed {fmtDate(fp.created_at)}</span>
        </div>

        <FlagActionButton
          targetId={id}
          mode="lender-flagging-founder"
          isAlreadyFlagged={isAlreadyFlagged}
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
