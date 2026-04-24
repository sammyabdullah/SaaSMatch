'use client'

import { useState } from 'react'
import MultiSelect from '@/components/ui/multi-select'
import { submitFounderProfile } from '@/app/actions/onboarding'
import type { FounderStage, ArrRange, GtmMotion, RevenueModel } from '@/lib/supabase/types'

function normalizeUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return 'https://' + url
}

const PRODUCT_CATEGORIES = [
  'iPaaS', 'Vertical SaaS', 'DevTools', 'Security',
  'Data & Analytics', 'HR Tech', 'FinTech', 'MarTech', 'RevOps', 'Ed Tech', 'Healthcare', 'Other',
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

interface FormState {
  company_name: string
  website: string
  location: string
  founded_year: string
  stage: string
  product_categories: string[]
  arr_range: string
  mom_growth_pct: string
  gtm_motion: string
  revenue_model: string
  raising_amount_usd: string
  why_now: string
}

const empty: FormState = {
  company_name: '', website: '', location: '', founded_year: '',
  stage: '', product_categories: [], arr_range: '',
  mom_growth_pct: '',
  gtm_motion: '', revenue_model: '',
  raising_amount_usd: '', why_now: '',
}

const inputCls =
  'w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent'

const selectCls = inputCls + ' bg-white'

export default function FounderForm() {
  const [form, setForm] = useState<FormState>(empty)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  function validate(): string | null {
    if (!form.company_name.trim()) return 'Company name is required.'
    if (!form.location.trim()) return 'Location is required.'
    if (!form.founded_year || isNaN(Number(form.founded_year)))
      return 'Founded year is required.'
    if (!form.stage) return 'Stage is required.'
    if (form.product_categories.length === 0)
      return 'Select at least one product category.'
    if (!form.arr_range) return 'ARR range is required.'
    if (!form.gtm_motion) return 'GTM motion is required.'
    if (!form.revenue_model) return 'Revenue model is required.'
    if (!form.raising_amount_usd) return 'Total raise amount is required.'
    if (!form.why_now.trim()) return 'Please fill in the "In your own words" field.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    const result = await submitFounderProfile({
      company_name: form.company_name,
      website: normalizeUrl(form.website),
      location: form.location,
      founded_year: Number(form.founded_year),
      stage: form.stage as FounderStage,
      product_categories: form.product_categories,
      arr_range: form.arr_range as ArrRange,
      mom_growth_pct: form.mom_growth_pct ? Number(form.mom_growth_pct) : null,
      gtm_motion: form.gtm_motion as GtmMotion,
      revenue_model: form.revenue_model as RevenueModel,
      raising_amount_usd: Number(form.raising_amount_usd),
      why_now: form.why_now,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="py-16 text-center">
        <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-5 h-5 text-[#534AB7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Profile submitted</h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
          Your profile is under review. We&apos;ll notify you by email when
          it&apos;s approved — usually within 2 business days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">

      {/* Company */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
          Your company
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => set('company_name', e.target.value)}
              className={inputCls}
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="text"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
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
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              className={inputCls}
              placeholder="San Francisco, CA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Founded year</label>
            <input
              type="number"
              value={form.founded_year}
              onChange={(e) => set('founded_year', e.target.value)}
              className={inputCls}
              placeholder="2021"
              min={1900}
              max={new Date().getFullYear() + 1}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
          <select
            value={form.stage}
            onChange={(e) => set('stage', e.target.value)}
            className={selectCls}
          >
            <option value="">Select stage</option>
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product categories</label>
          <MultiSelect
            options={PRODUCT_CATEGORIES}
            selected={form.product_categories}
            onChange={(v) => set('product_categories', v)}
          />
        </div>
      </section>

      {/* Traction */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
          Traction
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ARR range</label>
          <select
            value={form.arr_range}
            onChange={(e) => set('arr_range', e.target.value)}
            className={selectCls}
          >
            <option value="">Select ARR range</option>
            {ARR_RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">YOY Growth % <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="number"
            value={form.mom_growth_pct}
            onChange={(e) => set('mom_growth_pct', e.target.value)}
            className={inputCls}
            placeholder="80"
            min={0}
          />
        </div>
      </section>

      {/* Go-to-market & Raise */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
          Go-to-market &amp; raise
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GTM motion</label>
            <select
              value={form.gtm_motion}
              onChange={(e) => set('gtm_motion', e.target.value)}
              className={selectCls}
            >
              <option value="">Select GTM motion</option>
              {GTM_MOTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Revenue model</label>
            <select
              value={form.revenue_model}
              onChange={(e) => set('revenue_model', e.target.value)}
              className={selectCls}
            >
              <option value="">Select revenue model</option>
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
            value={form.raising_amount_usd}
            onChange={(e) => set('raising_amount_usd', e.target.value)}
            className={inputCls}
            placeholder="2000000"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            In your own words{' '}
            <span className="text-gray-400 font-normal">(max 500 characters)</span>
          </label>
          <textarea
            value={form.why_now}
            onChange={(e) => set('why_now', e.target.value)}
            maxLength={500}
            rows={3}
            className={inputCls + ' resize-none'}
            placeholder="What makes this the right moment for your company…"
          />
          <p className="text-xs text-gray-400 text-right mt-1">
            {form.why_now.length}/500
          </p>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#534AB7] text-white py-2.5 rounded-md text-sm font-medium hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting…' : 'Submit profile'}
      </button>
    </form>
  )
}
