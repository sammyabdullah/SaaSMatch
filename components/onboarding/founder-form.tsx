'use client'

import { useState } from 'react'
import MultiSelect from '@/components/ui/multi-select'
import Toggle from '@/components/ui/toggle'
import { submitFounderProfile } from '@/app/actions/onboarding'
import type { FounderStage, ArrRange, GtmMotion, RevenueModel } from '@/lib/supabase/types'

const PRODUCT_CATEGORIES = [
  'iPaaS', 'Vertical SaaS', 'DevTools', 'Security',
  'Data & Analytics', 'HR Tech', 'FinTech', 'MarTech', 'RevOps', 'Other',
]

const STAGES: { value: FounderStage; label: string }[] = [
  { value: 'pre-seed', label: 'Pre-seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
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
  // Step 1
  company_name: string
  location: string
  founded_year: string
  stage: string
  product_categories: string[]
  // Step 2
  arr_range: string
  mom_growth_pct: string
  nrr_pct: string
  acv_usd: string
  gtm_motion: string
  revenue_model: string
  why_now: string
  // Step 3
  raising_amount_usd: string
  wants_lead: boolean
  wants_board_seat: boolean
  check_size_min_usd: string
  check_size_max_usd: string
  geography_preference: string
}

const empty: FormState = {
  company_name: '', location: '', founded_year: '', stage: '',
  product_categories: [], arr_range: '', mom_growth_pct: '', nrr_pct: '',
  acv_usd: '', gtm_motion: '', revenue_model: '', why_now: '',
  raising_amount_usd: '', wants_lead: false, wants_board_seat: false,
  check_size_min_usd: '', check_size_max_usd: '', geography_preference: '',
}

const inputCls =
  'w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent'

const selectCls = inputCls + ' bg-white'

const STEP_LABELS = ['Company basics', 'Metrics', 'Raise details']

export default function FounderForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(empty)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!form.company_name.trim()) return 'Company name is required.'
      if (!form.location.trim()) return 'Location is required.'
      if (!form.founded_year || isNaN(Number(form.founded_year)))
        return 'Founded year is required.'
      if (!form.stage) return 'Stage is required.'
      if (form.product_categories.length === 0)
        return 'Select at least one product category.'
    }
    if (s === 2) {
      if (!form.arr_range) return 'ARR range is required.'
      if (!form.mom_growth_pct) return 'MoM growth % is required.'
      if (!form.nrr_pct) return 'NRR % is required.'
      if (!form.acv_usd) return 'ACV is required.'
      if (!form.gtm_motion) return 'GTM motion is required.'
      if (!form.revenue_model) return 'Revenue model is required.'
      if (!form.why_now.trim()) return '"Why now" is required.'
    }
    if (s === 3) {
      if (!form.raising_amount_usd) return 'Raising amount is required.'
      if (!form.check_size_min_usd) return 'Min check size is required.'
      if (!form.check_size_max_usd) return 'Max check size is required.'
      if (Number(form.check_size_min_usd) > Number(form.check_size_max_usd))
        return 'Min check size must be ≤ max.'
      if (!form.geography_preference.trim())
        return 'Geography preference is required.'
    }
    return null
  }

  function handleContinue() {
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError('')
    setStep((s) => s + 1)
  }

  async function handleSubmit() {
    const err = validateStep(3)
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    const result = await submitFounderProfile({
      company_name: form.company_name,
      location: form.location,
      founded_year: Number(form.founded_year),
      stage: form.stage as FounderStage,
      product_categories: form.product_categories,
      arr_range: form.arr_range as ArrRange,
      mom_growth_pct: Number(form.mom_growth_pct),
      nrr_pct: Number(form.nrr_pct),
      acv_usd: Number(form.acv_usd),
      gtm_motion: form.gtm_motion as GtmMotion,
      revenue_model: form.revenue_model as RevenueModel,
      why_now: form.why_now,
      raising_amount_usd: Number(form.raising_amount_usd),
      wants_lead: form.wants_lead,
      wants_board_seat: form.wants_board_seat,
      check_size_min_usd: Number(form.check_size_min_usd),
      check_size_max_usd: Number(form.check_size_max_usd),
      geography_preference: form.geography_preference,
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
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Profile submitted
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
          Your profile is under review. We&apos;ll notify you by email when
          it&apos;s approved — usually within 2 business days.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                s < step
                  ? 'bg-purple-100 text-[#534AB7]'
                  : s === step
                  ? 'bg-[#534AB7] text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            {s < 3 && (
              <div
                className={`w-8 h-px ${s < step ? 'bg-[#534AB7]' : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm text-gray-500">{STEP_LABELS[step - 1]}</span>
      </div>

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company name
            </label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => set('company_name', e.target.value)}
              className={inputCls}
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              className={inputCls}
              placeholder="San Francisco, CA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Founded year
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage
            </label>
            <select
              value={form.stage}
              onChange={(e) => set('stage', e.target.value)}
              className={selectCls}
            >
              <option value="">Select stage</option>
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product categories
            </label>
            <MultiSelect
              options={PRODUCT_CATEGORIES}
              selected={form.product_categories}
              onChange={(v) => set('product_categories', v)}
            />
          </div>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ARR range
            </label>
            <select
              value={form.arr_range}
              onChange={(e) => set('arr_range', e.target.value)}
              className={selectCls}
            >
              <option value="">Select ARR range</option>
              {ARR_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MoM growth %
              </label>
              <input
                type="number"
                value={form.mom_growth_pct}
                onChange={(e) => set('mom_growth_pct', e.target.value)}
                className={inputCls}
                placeholder="15"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NRR %
              </label>
              <input
                type="number"
                value={form.nrr_pct}
                onChange={(e) => set('nrr_pct', e.target.value)}
                className={inputCls}
                placeholder="110"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ACV (USD)
              </label>
              <input
                type="number"
                value={form.acv_usd}
                onChange={(e) => set('acv_usd', e.target.value)}
                className={inputCls}
                placeholder="25000"
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GTM motion
            </label>
            <select
              value={form.gtm_motion}
              onChange={(e) => set('gtm_motion', e.target.value)}
              className={selectCls}
            >
              <option value="">Select GTM motion</option>
              {GTM_MOTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Revenue model
            </label>
            <select
              value={form.revenue_model}
              onChange={(e) => set('revenue_model', e.target.value)}
              className={selectCls}
            >
              <option value="">Select revenue model</option>
              {REVENUE_MODELS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Why now{' '}
              <span className="text-gray-400 font-normal">
                (max 500 characters)
              </span>
            </label>
            <textarea
              value={form.why_now}
              onChange={(e) => set('why_now', e.target.value)}
              maxLength={500}
              rows={4}
              className={inputCls + ' resize-none'}
              placeholder="What's the market timing insight that makes this the right moment…"
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {form.why_now.length}/500
            </p>
          </div>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total raise (USD)
            </label>
            <input
              type="number"
              value={form.raising_amount_usd}
              onChange={(e) => set('raising_amount_usd', e.target.value)}
              className={inputCls}
              placeholder="2000000"
              min={0}
            />
          </div>

          <div className="space-y-3 py-1">
            <Toggle
              checked={form.wants_lead}
              onChange={(v) => set('wants_lead', v)}
              label="Looking for a lead investor"
            />
            <Toggle
              checked={form.wants_board_seat}
              onChange={(v) => set('wants_board_seat', v)}
              label="Open to board seat"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check size min (USD)
              </label>
              <input
                type="number"
                value={form.check_size_min_usd}
                onChange={(e) => set('check_size_min_usd', e.target.value)}
                className={inputCls}
                placeholder="250000"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check size max (USD)
              </label>
              <input
                type="number"
                value={form.check_size_max_usd}
                onChange={(e) => set('check_size_max_usd', e.target.value)}
                className={inputCls}
                placeholder="1000000"
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Geography preference
            </label>
            <input
              type="text"
              value={form.geography_preference}
              onChange={(e) => set('geography_preference', e.target.value)}
              className={inputCls}
              placeholder="US, Canada"
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => { setError(''); setStep((s) => s - 1) }}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:border-gray-400 transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleContinue}
            className="px-6 py-2 text-sm bg-[#534AB7] text-white rounded-md hover:bg-[#4339A0] transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 text-sm bg-[#534AB7] text-white rounded-md hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting…' : 'Submit profile'}
          </button>
        )}
      </div>
    </div>
  )
}
