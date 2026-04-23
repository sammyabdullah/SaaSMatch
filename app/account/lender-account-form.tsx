'use client'

import { useState } from 'react'
import MultiSelect from '@/components/ui/multi-select'
import { updateLenderProfile } from '@/app/actions/account'
import type { FounderStage, Database } from '@/lib/supabase/types'

type LenderProfileRow = Database['public']['Tables']['lender_profiles']['Row']

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
  { value: 'series-c', label: 'Series C' },
]

const inputCls =
  'w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent'

interface Props {
  initialData: LenderProfileRow
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export default function LenderAccountForm({ initialData }: Props) {
  const [institution_name, setInstitutionName] = useState(initialData.institution_name)
  const [contact_name, setContactName] = useState(initialData.contact_name)
  const [website, setWebsite] = useState(initialData.website ?? '')
  const [location, setLocation] = useState(initialData.location)
  const [loan_size_min_usd, setLoanMin] = useState(String(initialData.loan_size_min_usd))
  const [loan_size_max_usd, setLoanMax] = useState(String(initialData.loan_size_max_usd))
  const [loan_types, setLoanTypes] = useState<string[]>(initialData.loan_types ?? [])
  const [stages, setStages] = useState<FounderStage[]>((initialData.stages ?? []) as FounderStage[])
  const [geography_focus, setGeographyFocus] = useState(initialData.geography_focus)
  const [saas_subcategories, setSaasSubcategories] = useState<string[]>(initialData.saas_subcategories ?? [])
  const [arr_min_requirement, setArrMin] = useState(String(initialData.arr_min_requirement))
  const [arr_max_sweet_spot, setArrMax] = useState(String(initialData.arr_max_sweet_spot))
  const [thesis_statement, setThesis] = useState(initialData.thesis_statement)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const result = await updateLenderProfile({
      institution_name,
      contact_name,
      website: website ? normalizeUrl(website) : null,
      location,
      loan_size_min_usd: Number(loan_size_min_usd),
      loan_size_max_usd: Number(loan_size_max_usd),
      loan_types,
      stages,
      geography_focus,
      saas_subcategories,
      arr_min_requirement: Number(arr_min_requirement),
      arr_max_sweet_spot: Number(arr_max_sweet_spot),
      thesis_statement,
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Institution name</label>
          <input type="text" value={institution_name} onChange={(e) => setInstitutionName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
          <input type="text" value={contact_name} onChange={(e) => setContactName(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Website <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="firstnationalcapital.com" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loan size min (USD)</label>
          <input type="number" value={loan_size_min_usd} onChange={(e) => setLoanMin(e.target.value)} className={inputCls} min={0} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loan size max (USD)</label>
          <input type="number" value={loan_size_max_usd} onChange={(e) => setLoanMax(e.target.value)} className={inputCls} min={0} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Loan types</label>
        <MultiSelect options={LOAN_TYPES} selected={loan_types} onChange={setLoanTypes} minRequired={1} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Stages you lend to</label>
        <MultiSelect
          options={STAGE_OPTIONS.map((s) => s.label)}
          selected={stages.map((s) => STAGE_OPTIONS.find((o) => o.value === s)?.label ?? s)}
          onChange={(labels) =>
            setStages(
              labels.map((l) => STAGE_OPTIONS.find((o) => o.label === l)?.value).filter(Boolean) as FounderStage[]
            )
          }
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Geography focus</label>
        <input type="text" value={geography_focus} onChange={(e) => setGeographyFocus(e.target.value)} className={inputCls} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SaaS subcategories <span className="text-gray-400 font-normal">(select at least 1)</span>
        </label>
        <MultiSelect options={SAAS_SUBCATEGORIES} selected={saas_subcategories} onChange={setSaasSubcategories} minRequired={1} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ARR minimum requirement (USD)</label>
          <input type="number" value={arr_min_requirement} onChange={(e) => setArrMin(e.target.value)} className={inputCls} min={0} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ARR sweet spot max (USD)</label>
          <input type="number" value={arr_max_sweet_spot} onChange={(e) => setArrMax(e.target.value)} className={inputCls} min={0} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          In your own words <span className="text-gray-400 font-normal">(max 250 characters)</span>
        </label>
        <textarea
          value={thesis_statement}
          onChange={(e) => setThesis(e.target.value)}
          maxLength={250}
          rows={4}
          className={inputCls + ' resize-none'}
        />
        <p className="text-xs text-gray-400 text-right mt-1">{thesis_statement.length}/250</p>
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
