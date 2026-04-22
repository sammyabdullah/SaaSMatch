'use client'

import { useState } from 'react'
import MultiSelect from '@/components/ui/multi-select'
import { updateFounderProfile } from '@/app/actions/account'
import type { FounderStage, ArrRange, GtmMotion, RevenueModel, Database } from '@/lib/supabase/types'

type FounderProfileRow = Database['public']['Tables']['founder_profiles']['Row']

function normalizeUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return 'https://' + url
}

const PRODUCT_CATEGORIES = [
  'iPaaS', 'Vertical SaaS', 'DevTools', 'Security',
  'Data & Analytics', 'HR Tech', 'FinTech', 'MarTech', 'RevOps', 'Other',
]

const STAGES: { value: FounderStage; label: string }[] = [
  { value: 'pre-seed', label: 'Pre-seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
  { value: 'series-c', label: 'Series C' },
]

const ARR_RANGES: { value: ArrRange; label: string }[] = [
  { value: '0-500k', label: '$0 – $500K' },
  { value: '500k-2m', label: '$500K – $2M' },
  { value: '2m-5m', label: '$2M – $5M' },
  { value: '5m-plus', label: '$5M+' },
]

const GTM_MOTIONS: { value: GtmMotion; label: string }[] = [
  { value: 'sales-led', label: 'Sales-led' },
  { value: 'product-led', label: 'Product-led' },
  { value: 'hybrid', label: 'Hybrid' },
]

const REVENUE_MODELS: { value: RevenueModel; label: string }[] = [
  { value: 'seat-based', label: 'Seat-based' },
  { value: 'usage-based', label: 'Usage-based' },
  { value: 'platform-fee', label: 'Platform fee' },
  { value: 'other', label: 'Other' },
]

const inputCls =
  'w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent'
const selectCls = inputCls + ' bg-white'

interface Props {
  initialData: FounderProfileRow
}

export default function FounderAccountForm({ initialData }: Props) {
  const [company_name, setCompanyName] = useState(initialData.company_name)
  const [website, setWebsite] = useState(initialData.website ?? '')
  const [location, setLocation] = useState(initialData.location)
  const [founded_year, setFoundedYear] = useState(String(initialData.founded_year))
  const [stage, setStage] = useState<string>(initialData.stage)
  const [product_categories, setProductCategories] = useState<string[]>(
    initialData.product_categories ?? []
  )
  const [arr_range, setArrRange] = useState<string>(initialData.arr_range)
  const [mom_growth_pct, setMomGrowth] = useState(initialData.mom_growth_pct != null ? String(initialData.mom_growth_pct) : '')
  const [gtm_motion, setGtmMotion] = useState<string>(initialData.gtm_motion)
  const [revenue_model, setRevenueModel] = useState<string>(initialData.revenue_model)
  const [raising_amount_usd, setRaising] = useState(String(initialData.raising_amount_usd))
  const [why_now, setWhyNow] = useState(initialData.why_now)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const result = await updateFounderProfile({
      company_name,
      website: normalizeUrl(website),
      location,
      founded_year: Number(founded_year),
      stage: stage as FounderStage,
      product_categories,
      arr_range: arr_range as ArrRange,
      mom_growth_pct: mom_growth_pct ? Number(mom_growth_pct) : null,
      gtm_motion: gtm_motion as GtmMotion,
      revenue_model: revenue_model as RevenueModel,
      raising_amount_usd: Number(raising_amount_usd),
      why_now,
    })

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
          <input
            type="text"
            value={company_name}
            onChange={(e) => setCompanyName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className={inputCls}
            placeholder="acme.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Founded year</label>
          <input
            type="number"
            value={founded_year}
            onChange={(e) => setFoundedYear(e.target.value)}
            className={inputCls}
            min={1900}
            max={new Date().getFullYear() + 1}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
        <select value={stage} onChange={(e) => setStage(e.target.value)} className={selectCls}>
          {STAGES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Product categories</label>
        <MultiSelect
          options={PRODUCT_CATEGORIES}
          selected={product_categories}
          onChange={setProductCategories}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ARR range</label>
        <select value={arr_range} onChange={(e) => setArrRange(e.target.value)} className={selectCls}>
          {ARR_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">YOY Growth % <span className="text-gray-400 font-normal">(optional)</span></label>
        <input
          type="number"
          value={mom_growth_pct}
          onChange={(e) => setMomGrowth(e.target.value)}
          className={inputCls}
          min={0}
          placeholder="80"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GTM motion</label>
          <select value={gtm_motion} onChange={(e) => setGtmMotion(e.target.value)} className={selectCls}>
            {GTM_MOTIONS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Revenue model</label>
          <select value={revenue_model} onChange={(e) => setRevenueModel(e.target.value)} className={selectCls}>
            {REVENUE_MODELS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Total raise (USD)</label>
        <input
          type="number"
          value={raising_amount_usd}
          onChange={(e) => setRaising(e.target.value)}
          className={inputCls}
          min={0}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          In your own words{' '}
          <span className="text-gray-400 font-normal">(max 500 characters)</span>
        </label>
        <textarea
          value={why_now}
          onChange={(e) => setWhyNow(e.target.value)}
          maxLength={500}
          rows={3}
          className={inputCls + ' resize-none'}
        />
        <p className="text-xs text-gray-400 text-right mt-1">{why_now.length}/500</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Profile saved successfully.</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-[#534AB7] text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
