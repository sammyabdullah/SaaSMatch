'use client'

import { useState } from 'react'
import MultiSelect from '@/components/ui/multi-select'
import Toggle from '@/components/ui/toggle'
import { submitLenderProfile } from '@/app/actions/onboarding'
import type { FounderStage } from '@/lib/supabase/types'

const LOAN_TYPES = [
  'Revenue-Based Financing', 'Term Loans', 'Lines of Credit',
  'Asset-Based Lending', 'Mezzanine', 'Venture Debt', 'Other',
]

const SAAS_SUBCATEGORIES = [
  'iPaaS', 'Vertical SaaS', 'DevTools', 'Security',
  'Data & Analytics', 'HR Tech', 'FinTech', 'MarTech', 'RevOps', 'Ed Tech', 'Other',
]

const STAGE_OPTIONS: { value: FounderStage; label: string }[] = [
  { value: 'pre-seed', label: 'Pre-seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
]

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

interface FormState {
  institution_name: string
  contact_name: string
  website: string
  location: string
  loan_size_min_usd: string
  loan_size_max_usd: string
  loan_types: string[]
  stages: FounderStage[]
  geography_focus: string
  saas_subcategories: string[]
  arr_min_requirement: string
  arr_max_sweet_spot: string
  thesis_statement: string
}

const empty: FormState = {
  institution_name: '', contact_name: '', website: '', location: '',
  loan_size_min_usd: '', loan_size_max_usd: '',
  loan_types: [], stages: [],
  geography_focus: '', saas_subcategories: [],
  arr_min_requirement: '', arr_max_sweet_spot: '',
  thesis_statement: '',
}

const inputCls =
  'w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent'

export default function LenderForm() {
  const [form, setForm] = useState<FormState>(empty)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  function validate(): string | null {
    if (!form.institution_name.trim()) return 'Institution name is required.'
    if (!form.contact_name.trim()) return 'Your name is required.'
    if (!form.location.trim()) return 'Location is required.'
    if (!form.loan_size_min_usd) return 'Min loan size is required.'
    if (!form.loan_size_max_usd) return 'Max loan size is required.'
    if (Number(form.loan_size_min_usd) > Number(form.loan_size_max_usd))
      return 'Min loan size must be ≤ max.'
    if (form.loan_types.length === 0) return 'Select at least one loan type.'
    if (form.stages.length === 0) return 'Select at least one stage.'
    if (!form.geography_focus.trim()) return 'Geography focus is required.'
    if (form.saas_subcategories.length < 1)
      return 'Select at least 1 SaaS subcategory.'
    if (!form.arr_min_requirement) return 'ARR minimum requirement is required.'
    if (!form.arr_max_sweet_spot) return 'ARR sweet spot max is required.'
    if (Number(form.arr_min_requirement) > Number(form.arr_max_sweet_spot))
      return 'ARR min must be ≤ max.'
    if (!form.thesis_statement.trim()) return 'Please fill in the "In your own words" field.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    const result = await submitLenderProfile({
      institution_name: form.institution_name,
      contact_name: form.contact_name,
      website: form.website ? normalizeUrl(form.website) : null,
      location: form.location,
      loan_size_min_usd: Number(form.loan_size_min_usd),
      loan_size_max_usd: Number(form.loan_size_max_usd),
      loan_types: form.loan_types,
      stages: form.stages,
      geography_focus: form.geography_focus,
      saas_subcategories: form.saas_subcategories,
      arr_min_requirement: Number(form.arr_min_requirement),
      arr_max_sweet_spot: Number(form.arr_max_sweet_spot),
      thesis_statement: form.thesis_statement,
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
          Thanks for applying. We review lender applications within 3
          business days.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Institution details */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
          About you
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution name
            </label>
            <input
              type="text"
              value={form.institution_name}
              onChange={(e) => set('institution_name', e.target.value)}
              className={inputCls}
              placeholder="First National Capital"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your name
            </label>
            <input
              type="text"
              value={form.contact_name}
              onChange={(e) => set('contact_name', e.target.value)}
              className={inputCls}
              placeholder="Jane Smith"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
            className={inputCls}
            placeholder="firstnationalcapital.com"
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
            placeholder="Chicago, IL"
          />
        </div>
      </section>

      {/* Lending parameters */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
          Lending parameters
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan size min (USD)
            </label>
            <input
              type="number"
              value={form.loan_size_min_usd}
              onChange={(e) => set('loan_size_min_usd', e.target.value)}
              className={inputCls}
              placeholder="250000"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan size max (USD)
            </label>
            <input
              type="number"
              value={form.loan_size_max_usd}
              onChange={(e) => set('loan_size_max_usd', e.target.value)}
              className={inputCls}
              placeholder="5000000"
              min={0}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loan types
          </label>
          <MultiSelect
            options={LOAN_TYPES}
            selected={form.loan_types}
            onChange={(v) => set('loan_types', v)}
            minRequired={1}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stages you lend to
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Geography focus
          </label>
          <input
            type="text"
            value={form.geography_focus}
            onChange={(e) => set('geography_focus', e.target.value)}
            className={inputCls}
            placeholder="US, Canada"
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
              (select at least 1)
            </span>
          </label>
          <MultiSelect
            options={SAAS_SUBCATEGORIES}
            selected={form.saas_subcategories}
            onChange={(v) => set('saas_subcategories', v)}
            minRequired={1}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ARR minimum requirement (USD)
            </label>
            <input
              type="number"
              value={form.arr_min_requirement}
              onChange={(e) => set('arr_min_requirement', e.target.value)}
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
              value={form.arr_max_sweet_spot}
              onChange={(e) => set('arr_max_sweet_spot', e.target.value)}
              className={inputCls}
              placeholder="10000000"
              min={0}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            In your own words{' '}
            <span className="text-gray-400 font-normal">(max 250 characters)</span>
          </label>
          <textarea
            value={form.thesis_statement}
            onChange={(e) => set('thesis_statement', e.target.value)}
            maxLength={250}
            rows={4}
            className={inputCls + ' resize-none'}
            placeholder="We focus on SaaS companies with predictable ARR and looking to grow without dilution…"
          />
          <p className="text-xs text-gray-400 text-right mt-1">
            {form.thesis_statement.length}/250
          </p>
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
