'use client'

import { useState } from 'react'
import MultiSelect from '@/components/ui/multi-select'
import Toggle from '@/components/ui/toggle'
import { submitInvestorProfile } from '@/app/actions/onboarding'
import type { FounderStage } from '@/lib/supabase/types'

const SAAS_SUBCATEGORIES = [
  'iPaaS', 'Vertical SaaS', 'DevTools', 'Security',
  'Data & Analytics', 'HR Tech', 'FinTech', 'MarTech', 'RevOps', 'Other',
]

const STAGE_OPTIONS: { value: FounderStage; label: string }[] = [
  { value: 'pre-seed', label: 'Pre-seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
]

interface FormState {
  firm_name: string
  partner_name: string
  location: string
  check_size_min_usd: string
  check_size_max_usd: string
  stages: FounderStage[]
  leads_rounds: boolean
  takes_board_seat: boolean
  geography_focus: string
  saas_subcategories: string[]
  arr_sweet_spot_min: string
  arr_sweet_spot_max: string
  thesis_statement: string
  value_beyond_capital: string
  typical_response_days: string
}

const empty: FormState = {
  firm_name: '', partner_name: '', location: '',
  check_size_min_usd: '', check_size_max_usd: '',
  stages: [], leads_rounds: false, takes_board_seat: false,
  geography_focus: '', saas_subcategories: [],
  arr_sweet_spot_min: '', arr_sweet_spot_max: '',
  thesis_statement: '', value_beyond_capital: '',
  typical_response_days: '',
}

const inputCls =
  'w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent'

export default function InvestorForm() {
  const [form, setForm] = useState<FormState>(empty)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  function validate(): string | null {
    if (!form.firm_name.trim()) return 'Firm name is required.'
    if (!form.partner_name.trim()) return 'Your name is required.'
    if (!form.location.trim()) return 'Location is required.'
    if (!form.check_size_min_usd) return 'Min check size is required.'
    if (!form.check_size_max_usd) return 'Max check size is required.'
    if (Number(form.check_size_min_usd) > Number(form.check_size_max_usd))
      return 'Min check size must be ≤ max.'
    if (form.stages.length === 0) return 'Select at least one stage.'
    if (!form.geography_focus.trim()) return 'Geography focus is required.'
    if (form.saas_subcategories.length < 3)
      return 'Select at least 3 SaaS subcategories.'
    if (!form.arr_sweet_spot_min) return 'ARR sweet spot min is required.'
    if (!form.arr_sweet_spot_max) return 'ARR sweet spot max is required.'
    if (Number(form.arr_sweet_spot_min) > Number(form.arr_sweet_spot_max))
      return 'ARR min must be ≤ max.'
    if (!form.thesis_statement.trim()) return 'Thesis statement is required.'
    if (!form.value_beyond_capital.trim())
      return 'Value beyond capital is required.'
    if (!form.typical_response_days || Number(form.typical_response_days) <= 0)
      return 'Typical response days is required.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    const result = await submitInvestorProfile({
      firm_name: form.firm_name,
      partner_name: form.partner_name,
      location: form.location,
      check_size_min_usd: Number(form.check_size_min_usd),
      check_size_max_usd: Number(form.check_size_max_usd),
      stages: form.stages,
      leads_rounds: form.leads_rounds,
      takes_board_seat: form.takes_board_seat,
      geography_focus: form.geography_focus,
      saas_subcategories: form.saas_subcategories,
      arr_sweet_spot_min: Number(form.arr_sweet_spot_min),
      arr_sweet_spot_max: Number(form.arr_sweet_spot_max),
      thesis_statement: form.thesis_statement,
      value_beyond_capital: form.value_beyond_capital,
      typical_response_days: Number(form.typical_response_days),
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
          Application received
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
          Thanks for applying. We review investor applications within 3
          business days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Firm details */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
          About you
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firm name
            </label>
            <input
              type="text"
              value={form.firm_name}
              onChange={(e) => set('firm_name', e.target.value)}
              className={inputCls}
              placeholder="Blossom Street Capital"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your name
            </label>
            <input
              type="text"
              value={form.partner_name}
              onChange={(e) => set('partner_name', e.target.value)}
              className={inputCls}
              placeholder="Jane Smith"
            />
          </div>
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
      </section>

      {/* Investment parameters */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
          Investment parameters
        </h2>

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
              placeholder="500000"
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
              placeholder="5000000"
              min={0}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stages you invest in
          </label>
          <MultiSelect
            options={STAGE_OPTIONS.map((s) => s.label)}
            selected={form.stages.map(
              (s) => STAGE_OPTIONS.find((o) => o.value === s)?.label ?? s
            )}
            onChange={(labels) =>
              set(
                'stages',
                labels
                  .map(
                    (l) => STAGE_OPTIONS.find((o) => o.label === l)?.value
                  )
                  .filter(Boolean) as FounderStage[]
              )
            }
          />
        </div>

        <div className="space-y-3 pt-1">
          <Toggle
            checked={form.leads_rounds}
            onChange={(v) => set('leads_rounds', v)}
            label="I lead rounds"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Geography focus
          </label>
          <input
            type="text"
            value={form.geography_focus}
            onChange={(e) => set('geography_focus', e.target.value)}
            className={inputCls}
            placeholder="US, Europe"
          />
        </div>
      </section>

      {/* Focus areas */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
          Focus areas
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SaaS subcategories{' '}
            <span className="text-gray-400 font-normal">
              (minimum 3 required)
            </span>
          </label>
          <MultiSelect
            options={SAAS_SUBCATEGORIES}
            selected={form.saas_subcategories}
            onChange={(v) => set('saas_subcategories', v)}
            minRequired={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ARR sweet spot min (USD)
            </label>
            <input
              type="number"
              value={form.arr_sweet_spot_min}
              onChange={(e) => set('arr_sweet_spot_min', e.target.value)}
              className={inputCls}
              placeholder="500000"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ARR sweet spot max (USD)
            </label>
            <input
              type="number"
              value={form.arr_sweet_spot_max}
              onChange={(e) => set('arr_sweet_spot_max', e.target.value)}
              className={inputCls}
              placeholder="5000000"
              min={0}
            />
          </div>
        </div>
      </section>

      {/* Thesis */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
          Your thesis
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thesis statement{' '}
            <span className="text-gray-400 font-normal">(max 500 characters)</span>
          </label>
          <textarea
            value={form.thesis_statement}
            onChange={(e) => set('thesis_statement', e.target.value)}
            maxLength={500}
            rows={4}
            className={inputCls + ' resize-none'}
            placeholder="We focus on B2B SaaS companies building in…"
          />
          <p className="text-xs text-gray-400 text-right mt-1">
            {form.thesis_statement.length}/500
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What you bring beyond capital{' '}
            <span className="text-gray-400 font-normal">(max 300 characters)</span>
          </label>
          <textarea
            value={form.value_beyond_capital}
            onChange={(e) => set('value_beyond_capital', e.target.value)}
            maxLength={300}
            rows={3}
            className={inputCls + ' resize-none'}
            placeholder="GTM support, enterprise intros, hiring network…"
          />
          <p className="text-xs text-gray-400 text-right mt-1">
            {form.value_beyond_capital.length}/300
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Typical days to respond after first meeting
          </label>
          <input
            type="number"
            value={form.typical_response_days}
            onChange={(e) => set('typical_response_days', e.target.value)}
            className={inputCls}
            placeholder="14"
            min={1}
          />
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#534AB7] text-white py-2.5 rounded-md text-sm font-medium hover:bg-[#4339A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  )
}
