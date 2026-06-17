/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateFounderProfile, updateInvestorProfile, updateLenderProfile } from '@/app/actions/admin'

const STAGE_OPTIONS = ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c']
const ARR_RANGE_OPTIONS = ['0-500k', '500k-2m', '2m-5m', '5m-plus']
const GTM_OPTIONS = ['sales-led', 'product-led', 'hybrid']
const REVENUE_OPTIONS = ['seat-based', 'usage-based', 'platform-fee', 'other']
const SAAS_SUBCATEGORIES = [
  'iPaaS', 'Vertical SaaS', 'DevTools', 'Security',
  'Data & Analytics', 'HR Tech', 'FinTech', 'MarTech', 'RevOps', 'Ed Tech', 'Healthcare', 'Other',
]

const inputCls = 'w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent'
const labelCls = 'block text-xs text-gray-500 mb-1'

function ChipSelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} type="button"
          onClick={() => onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o])}
          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
            selected.includes(o) ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'border-gray-200 text-gray-600 hover:border-[#534AB7]'
          }`}>
          {o.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </button>
      ))}
    </div>
  )
}

// ─── Edit Founder ────────────────────────────────────────────────────────────
export function EditFounderButton({ profile }: { profile: any }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [companyName, setCompanyName] = useState(profile.company_name ?? '')
  const [website, setWebsite] = useState(profile.website ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [foundedYear, setFoundedYear] = useState(String(profile.founded_year ?? ''))
  const [stage, setStage] = useState(profile.stage ?? '')
  const [arrRange, setArrRange] = useState(profile.arr_range ?? '')
  const [momGrowth, setMomGrowth] = useState(profile.mom_growth_pct != null ? String(profile.mom_growth_pct) : '')
  const [gtmMotion, setGtmMotion] = useState(profile.gtm_motion ?? '')
  const [revenueModel, setRevenueModel] = useState(profile.revenue_model ?? '')
  const [raisingAmount, setRaisingAmount] = useState(String(profile.raising_amount_usd ?? ''))
  const [whyNow, setWhyNow] = useState(profile.why_now ?? '')
  const [categories, setCategories] = useState<string[]>(profile.product_categories ?? [])

  async function handleSave() {
    setSaving(true)
    setError('')
    const result = await updateFounderProfile(profile.id, {
      company_name: companyName,
      website: website || null,
      location,
      founded_year: Number(foundedYear),
      stage,
      arr_range: arrRange,
      mom_growth_pct: momGrowth ? Number(momGrowth) : null,
      gtm_motion: gtmMotion,
      revenue_model: revenueModel,
      raising_amount_usd: Number(raisingAmount),
      why_now: whyNow,
      product_categories: categories,
    })
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium rounded-md border border-[#534AB7] text-[#534AB7] hover:bg-[#534AB7] hover:text-white transition-colors">
        Edit
      </button>
    )
  }

  return (
    <div className="border border-[#534AB7] rounded-lg p-5 mt-3 bg-white">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">Edit founder profile</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={labelCls}>Company name</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Website</label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://..." />
        </div>
        <div>
          <label className={labelCls}>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Founded year</label>
          <input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Stage</label>
          <select value={stage} onChange={(e) => setStage(e.target.value)} className={inputCls + ' bg-white'}>
            {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>ARR range</label>
          <select value={arrRange} onChange={(e) => setArrRange(e.target.value)} className={inputCls + ' bg-white'}>
            {ARR_RANGE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>YOY growth %</label>
          <input type="number" value={momGrowth} onChange={(e) => setMomGrowth(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>GTM motion</label>
          <select value={gtmMotion} onChange={(e) => setGtmMotion(e.target.value)} className={inputCls + ' bg-white'}>
            {GTM_OPTIONS.map((g) => <option key={g} value={g}>{g.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Revenue model</label>
          <select value={revenueModel} onChange={(e) => setRevenueModel(e.target.value)} className={inputCls + ' bg-white'}>
            {REVENUE_OPTIONS.map((r) => <option key={r} value={r}>{r.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Raising amount (USD)</label>
          <input type="number" value={raisingAmount} onChange={(e) => setRaisingAmount(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="mb-4">
        <label className={labelCls}>In their own words and traction</label>
        <textarea value={whyNow} onChange={(e) => setWhyNow(e.target.value)} rows={3} className={inputCls} />
      </div>
      <div className="mb-4">
        <label className={labelCls}>Product categories</label>
        <ChipSelect options={SAAS_SUBCATEGORIES} selected={categories} onChange={setCategories} />
      </div>
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-md bg-[#534AB7] text-white hover:bg-[#4339A0] transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Edit Investor ───────────────────────────────────────────────────────────
export function EditInvestorButton({ profile }: { profile: any }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [firmName, setFirmName] = useState(profile.firm_name ?? '')
  const [partnerName, setPartnerName] = useState(profile.partner_name ?? '')
  const [website, setWebsite] = useState(profile.website ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [checkMin, setCheckMin] = useState(String(profile.check_size_min_usd ?? ''))
  const [checkMax, setCheckMax] = useState(String(profile.check_size_max_usd ?? ''))
  const [arrMin, setArrMin] = useState(String(profile.arr_sweet_spot_min ?? ''))
  const [arrMax, setArrMax] = useState(String(profile.arr_sweet_spot_max ?? ''))
  const [leadsRounds, setLeadsRounds] = useState(profile.leads_rounds ?? false)
  const [geoFocus, setGeoFocus] = useState(profile.geography_focus ?? '')
  const [stages, setStages] = useState<string[]>(profile.stages ?? [])
  const [subcategories, setSubcategories] = useState<string[]>(profile.saas_subcategories ?? [])
  const [thesis, setThesis] = useState(profile.thesis_statement ?? '')

  async function handleSave() {
    setSaving(true)
    setError('')
    const result = await updateInvestorProfile(profile.id, {
      firm_name: firmName,
      partner_name: partnerName,
      website: website || null,
      location,
      check_size_min_usd: Number(checkMin),
      check_size_max_usd: Number(checkMax),
      arr_sweet_spot_min: Number(arrMin),
      arr_sweet_spot_max: Number(arrMax),
      leads_rounds: leadsRounds,
      geography_focus: geoFocus,
      stages,
      saas_subcategories: subcategories,
      thesis_statement: thesis,
    })
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium rounded-md border border-[#534AB7] text-[#534AB7] hover:bg-[#534AB7] hover:text-white transition-colors">
        Edit
      </button>
    )
  }

  return (
    <div className="border border-[#534AB7] rounded-lg p-5 mt-3 bg-white">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">Edit investor profile</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={labelCls}>Firm name</label>
          <input value={firmName} onChange={(e) => setFirmName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Partner name</label>
          <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Website</label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://..." />
        </div>
        <div>
          <label className={labelCls}>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Check size min (USD)</label>
          <input type="number" value={checkMin} onChange={(e) => setCheckMin(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Check size max (USD)</label>
          <input type="number" value={checkMax} onChange={(e) => setCheckMax(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>ARR sweet spot min (USD)</label>
          <input type="number" value={arrMin} onChange={(e) => setArrMin(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>ARR sweet spot max (USD)</label>
          <input type="number" value={arrMax} onChange={(e) => setArrMax(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Geography focus</label>
          <input value={geoFocus} onChange={(e) => setGeoFocus(e.target.value)} className={inputCls} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={leadsRounds} onChange={(e) => setLeadsRounds(e.target.checked)} className="rounded border-gray-300 text-[#534AB7]" />
            <span className="text-sm text-gray-700">Leads rounds</span>
          </label>
        </div>
      </div>
      <div className="mb-4">
        <label className={labelCls}>Stages</label>
        <ChipSelect options={STAGE_OPTIONS} selected={stages} onChange={setStages} />
      </div>
      <div className="mb-4">
        <label className={labelCls}>SaaS subcategories</label>
        <ChipSelect options={SAAS_SUBCATEGORIES} selected={subcategories} onChange={setSubcategories} />
      </div>
      <div className="mb-4">
        <label className={labelCls}>Thesis statement</label>
        <textarea value={thesis} onChange={(e) => setThesis(e.target.value)} rows={3} className={inputCls} />
      </div>
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-md bg-[#534AB7] text-white hover:bg-[#4339A0] transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Edit Lender ─────────────────────────────────────────────────────────────
export function EditLenderButton({ profile }: { profile: any }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [institutionName, setInstitutionName] = useState(profile.institution_name ?? '')
  const [contactName, setContactName] = useState(profile.contact_name ?? '')
  const [website, setWebsite] = useState(profile.website ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [loanMin, setLoanMin] = useState(String(profile.loan_size_min_usd ?? ''))
  const [loanMax, setLoanMax] = useState(String(profile.loan_size_max_usd ?? ''))
  const [arrMin, setArrMin] = useState(String(profile.arr_min_requirement ?? ''))
  const [arrMax, setArrMax] = useState(String(profile.arr_max_sweet_spot ?? ''))
  const [geoFocus, setGeoFocus] = useState(profile.geography_focus ?? '')
  const [stages, setStages] = useState<string[]>(profile.stages ?? [])
  const [subcategories, setSubcategories] = useState<string[]>(profile.saas_subcategories ?? [])
  const [thesis, setThesis] = useState(profile.thesis_statement ?? '')

  async function handleSave() {
    setSaving(true)
    setError('')
    const result = await updateLenderProfile(profile.id, {
      institution_name: institutionName,
      contact_name: contactName,
      website: website || null,
      location,
      loan_size_min_usd: Number(loanMin),
      loan_size_max_usd: Number(loanMax),
      arr_min_requirement: Number(arrMin),
      arr_max_sweet_spot: Number(arrMax),
      geography_focus: geoFocus,
      stages,
      saas_subcategories: subcategories,
      thesis_statement: thesis,
    })
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium rounded-md border border-[#534AB7] text-[#534AB7] hover:bg-[#534AB7] hover:text-white transition-colors">
        Edit
      </button>
    )
  }

  return (
    <div className="border border-[#534AB7] rounded-lg p-5 mt-3 bg-white">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">Edit lender profile</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={labelCls}>Institution name</label>
          <input value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Contact name</label>
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Website</label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://..." />
        </div>
        <div>
          <label className={labelCls}>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Loan size min (USD)</label>
          <input type="number" value={loanMin} onChange={(e) => setLoanMin(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Loan size max (USD)</label>
          <input type="number" value={loanMax} onChange={(e) => setLoanMax(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>ARR min requirement (USD)</label>
          <input type="number" value={arrMin} onChange={(e) => setArrMin(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>ARR max sweet spot (USD)</label>
          <input type="number" value={arrMax} onChange={(e) => setArrMax(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Geography focus</label>
          <input value={geoFocus} onChange={(e) => setGeoFocus(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="mb-4">
        <label className={labelCls}>Stages</label>
        <ChipSelect options={STAGE_OPTIONS} selected={stages} onChange={setStages} />
      </div>
      <div className="mb-4">
        <label className={labelCls}>SaaS subcategories</label>
        <ChipSelect options={SAAS_SUBCATEGORIES} selected={subcategories} onChange={setSubcategories} />
      </div>
      <div className="mb-4">
        <label className={labelCls}>Thesis statement</label>
        <textarea value={thesis} onChange={(e) => setThesis(e.target.value)} rows={3} className={inputCls} />
      </div>
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-md bg-[#534AB7] text-white hover:bg-[#4339A0] transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
