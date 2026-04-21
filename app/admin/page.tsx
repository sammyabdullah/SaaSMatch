import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApproveButton, RejectButton, ApproveInvestorButton, RejectInvestorButton, DeleteFounderButton, ApproveLenderButton, RejectLenderButton, DeleteLenderButton } from './approve-button'

function fmt(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function fmtArr(range: string) {
  const map: Record<string, string> = {
    '0-500k': '$0 – $500K',
    '500k-2m': '$500K – $2M',
    '2m-5m': '$2M – $5M',
    '5m-plus': '$5M+',
  }
  return map[range] ?? range
}

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Use admin client to bypass RLS and see all profiles
  const admin = createAdminClient()

  const { data: pending } = await admin
    .from('founder_profiles')
    .select('*, profiles(email)')
    .eq('is_approved', false)
    .neq('status', 'closed')
    .order('created_at', { ascending: true })

  const { data: approvedFounders } = await admin
    .from('founder_profiles')
    .select('*, profiles(email)')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: pendingInvestors } = await admin
    .from('investor_profiles')
    .select('*, profiles(email)')
    .eq('is_approved', false)
    .order('created_at', { ascending: true })

  const { data: approvedInvestors } = await admin
    .from('investor_profiles')
    .select('*, profiles(email)')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: pendingLenders } = await admin
    .from('lender_profiles')
    .select('*, profiles(email)')
    .eq('is_approved', false)
    .order('created_at', { ascending: true })

  const { data: approvedLenders } = await admin
    .from('lender_profiles')
    .select('*, profiles(email)')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20)

  const { count: approvedFounderCount } = await admin
    .from('founder_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_approved', true)

  const { count: approvedInvestorCount } = await admin
    .from('investor_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_approved', true)

  const { count: approvedLenderCount } = await admin
    .from('lender_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_approved', true)

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve founder profiles.</p>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        <div className="border border-gray-200 rounded-lg p-5">
          <p className="text-xs text-gray-400 mb-1">Approved founders</p>
          <p className="text-3xl font-semibold text-gray-900">{approvedFounderCount ?? 0}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-5">
          <p className="text-xs text-gray-400 mb-1">Approved investors</p>
          <p className="text-3xl font-semibold text-gray-900">{approvedInvestorCount ?? 0}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-5">
          <p className="text-xs text-gray-400 mb-1">Approved lenders</p>
          <p className="text-3xl font-semibold text-gray-900">{approvedLenderCount ?? 0}</p>
        </div>
      </div>

      {/* Pending Founders */}
      <section className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-base font-semibold text-gray-900">Founders — pending approval</h2>
          {pending && pending.length > 0 && (
            <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </div>
        {!pending || pending.length === 0 ? (
          <p className="text-sm text-gray-400">No founders pending approval.</p>
        ) : (
          <div className="space-y-6">
            {pending.map((fp) => (
              <FounderCard key={fp.id} fp={fp} showActions />
            ))}
          </div>
        )}
      </section>

      {/* Pending Investors */}
      <section className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-base font-semibold text-gray-900">Investors — pending approval</h2>
          {pendingInvestors && pendingInvestors.length > 0 && (
            <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {pendingInvestors.length}
            </span>
          )}
        </div>
        {!pendingInvestors || pendingInvestors.length === 0 ? (
          <p className="text-sm text-gray-400">No investors pending approval.</p>
        ) : (
          <div className="space-y-6">
            {pendingInvestors.map((ip) => (
              <InvestorCard key={ip.id} ip={ip} showActions />
            ))}
          </div>
        )}
      </section>

      {/* Approved Founders */}
      <section className="mb-14">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Founders — recently approved</h2>
        {!approvedFounders || approvedFounders.length === 0 ? (
          <p className="text-sm text-gray-400">No approved founders yet.</p>
        ) : (
          <div className="space-y-6">
            {approvedFounders.map((fp) => (
              <FounderCard key={fp.id} fp={fp} showActions={false} />
            ))}
          </div>
        )}
      </section>

      {/* Approved Investors */}
      <section className="mb-14">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Investors — recently approved</h2>
        {!approvedInvestors || approvedInvestors.length === 0 ? (
          <p className="text-sm text-gray-400">No approved investors yet.</p>
        ) : (
          <div className="space-y-6">
            {approvedInvestors.map((ip) => (
              <InvestorCard key={ip.id} ip={ip} showActions={false} />
            ))}
          </div>
        )}
      </section>

      {/* Pending Lenders */}
      <section className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-base font-semibold text-gray-900">Lenders — pending approval</h2>
          {pendingLenders && pendingLenders.length > 0 && (
            <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {pendingLenders.length}
            </span>
          )}
        </div>
        {!pendingLenders || pendingLenders.length === 0 ? (
          <p className="text-sm text-gray-400">No lenders pending approval.</p>
        ) : (
          <div className="space-y-6">
            {pendingLenders.map((lp) => (
              <LenderCard key={lp.id} lp={lp} showActions />
            ))}
          </div>
        )}
      </section>

      {/* Approved Lenders */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-6">Lenders — recently approved</h2>
        {!approvedLenders || approvedLenders.length === 0 ? (
          <p className="text-sm text-gray-400">No approved lenders yet.</p>
        ) : (
          <div className="space-y-6">
            {approvedLenders.map((lp) => (
              <LenderCard key={lp.id} lp={lp} showActions={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function FounderCard({
  fp,
  showActions,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fp: any
  showActions: boolean
}) {
  const email = fp.profiles?.email ?? '—'

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{fp.company_name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{email}</p>
          {fp.website && (
            <p className="text-sm text-[#534AB7] mt-0.5">{fp.website}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            fp.is_approved
              ? 'bg-green-50 text-green-700'
              : 'bg-amber-50 text-amber-700'
          }`}>
            {fp.is_approved ? 'Approved' : 'Pending'}
          </span>
          <span className="text-xs text-gray-400">{fmtDate(fp.created_at)}</span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mb-5 text-sm">
        <Field label="Location" value={fp.location} />
        <Field label="Founded" value={String(fp.founded_year)} />
        <Field label="Stage" value={fmt(fp.stage)} />
        <Field label="ARR" value={fmtArr(fp.arr_range)} />
        {fp.mom_growth_pct != null && <Field label="YOY growth" value={`${fp.mom_growth_pct}%`} />}
        <Field label="GTM motion" value={fmt(fp.gtm_motion)} />
        <Field label="Revenue model" value={fmt(fp.revenue_model)} />
        <Field label="Total raise" value={fmtUsd(fp.raising_amount_usd)} />
      </div>

      {/* Categories */}
      {fp.product_categories?.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1.5">Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {fp.product_categories.map((c: string) => (
              <span
                key={c}
                className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* In their own words */}
      {fp.why_now && (
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1">In their own words</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-md px-4 py-3 italic">
            &ldquo;{fp.why_now}&rdquo;
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {showActions && (
          <>
            <ApproveButton founderId={fp.id} />
            <RejectButton founderId={fp.id} />
          </>
        )}
        <DeleteFounderButton founderId={fp.id} />
      </div>
    </div>
  )
}

function InvestorCard({
  ip,
  showActions,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ip: any
  showActions: boolean
}) {
  const email = ip.profiles?.email ?? '—'

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{ip.firm_name}</h3>
          <p className="text-sm text-gray-700 mt-0.5">{ip.partner_name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{email}</p>
          {ip.website && (
            <a href={ip.website} target="_blank" rel="noopener noreferrer"
               className="text-sm text-[#534AB7] mt-0.5 hover:underline block">
              {ip.website}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            ip.is_approved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {ip.is_approved ? 'Approved' : 'Pending'}
          </span>
          <span className="text-xs text-gray-400">{fmtDate(ip.created_at)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mb-5 text-sm">
        <Field label="Location" value={ip.location} />
        <Field label="Check size" value={`${fmtUsd(ip.check_size_min_usd)} – ${fmtUsd(ip.check_size_max_usd)}`} />
        <Field label="ARR sweet spot" value={`${fmtUsd(ip.arr_sweet_spot_min)} – ${fmtUsd(ip.arr_sweet_spot_max)}`} />
        <Field label="Leads rounds" value={ip.leads_rounds ? 'Yes' : 'No'} />
        <Field label="Geography" value={ip.geography_focus} />
        <Field label="Stages" value={ip.stages?.map(fmt).join(', ') ?? '—'} />
      </div>

      {ip.saas_subcategories?.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1.5">SaaS subcategories</p>
          <div className="flex flex-wrap gap-1.5">
            {ip.saas_subcategories.map((c: string) => (
              <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {ip.thesis_statement && (
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1">In their own words</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-md px-4 py-3 italic">
            &ldquo;{ip.thesis_statement}&rdquo;
          </p>
        </div>
      )}

      {showActions && (
        <div className="flex gap-3 pt-2">
          <ApproveInvestorButton investorId={ip.id} />
          <RejectInvestorButton investorId={ip.id} />
        </div>
      )}
    </div>
  )
}

function LenderCard({
  lp,
  showActions,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lp: any
  showActions: boolean
}) {
  const email = lp.profiles?.email ?? '—'

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{lp.institution_name}</h3>
          <p className="text-sm text-gray-700 mt-0.5">{lp.contact_name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{email}</p>
          {lp.website && (
            <a href={lp.website} target="_blank" rel="noopener noreferrer"
               className="text-sm text-[#534AB7] mt-0.5 hover:underline block">
              {lp.website}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            lp.is_approved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {lp.is_approved ? 'Approved' : 'Pending'}
          </span>
          <span className="text-xs text-gray-400">{fmtDate(lp.created_at)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mb-5 text-sm">
        <Field label="Location" value={lp.location} />
        <Field label="Loan size" value={`${fmtUsd(lp.loan_size_min_usd)} – ${fmtUsd(lp.loan_size_max_usd)}`} />
        <Field label="ARR range" value={`${fmtUsd(lp.arr_min_requirement)} – ${fmtUsd(lp.arr_max_sweet_spot)}`} />
        <Field label="Geography" value={lp.geography_focus} />
        <Field label="Stages" value={lp.stages?.map(fmt).join(', ') ?? '—'} />
      </div>

      {lp.loan_types?.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1.5">Loan types</p>
          <div className="flex flex-wrap gap-1.5">
            {lp.loan_types.map((t: string) => (
              <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {lp.saas_subcategories?.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1.5">SaaS subcategories</p>
          <div className="flex flex-wrap gap-1.5">
            {lp.saas_subcategories.map((c: string) => (
              <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {lp.thesis_statement && (
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1">In their own words</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-md px-4 py-3 italic">
            &ldquo;{lp.thesis_statement}&rdquo;
          </p>
        </div>
      )}

      {showActions && (
        <div className="flex gap-3 pt-2">
          <ApproveLenderButton lenderId={lp.id} />
          <RejectLenderButton lenderId={lp.id} />
        </div>
      )}
      {!showActions && (
        <div className="flex gap-3 pt-2">
          <DeleteLenderButton lenderId={lp.id} />
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-800 font-medium">{value}</p>
    </div>
  )
}
