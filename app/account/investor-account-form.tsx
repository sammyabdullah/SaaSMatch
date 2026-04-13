'use client'

import { useState } from 'react'
import MultiSelect from '@/components/ui/multi-select'
import Toggle from '@/components/ui/toggle'
import { updateInvestorProfile } from '@/app/actions/account'
import type { FounderStage, Database } from '@/lib/supabase/types'

type InvestorProfileRow = Database['public']['Tables']['investor_profiles']['Row']

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

const inputCls =
  'w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent'

interface Props {
  initialData: InvestorProfileRow
}

export default function InvestorAccountForm({ initialData }: Props) {
  const [firm_name, setFirmName] = useState(initialData.firm_name)
  const [partner_name, setPartnerName] = useState(initialData.partner_name)
  const [location, setLocation] = useState(initialData.location)
  const [check_size_min_usd, setCheckMin] = useState(String(initialData.check_size_min_usd))
  const [check_size_max_usd, setCheckMax] = useState(String(initialData.check_size_max_usd))
  const [stages, setStages] = useState<FounderStage[]>(initialData.stages ?? [])
  const [leads_rounds, setLeadsRounds] = useState(initialData.leads_rounds)
  const [geography_focus, setGeographyFocus] = useState(initialData.geography_focus)
  const [saas_subcategories, setSaasSubcategories] = useState<string[]>(
    initialData.saas_subcategories ?? []
  )
  const [arr_sweet_spot_min, setArrMin] = useState(String(initialData.arr_sweet_spot_min))
  const [arr_sweet_spot_max, setArrMax] = useState(String(initialData.arr_sweet_spot_max))
  const [thesis_statement, setThesis] = useState(initialData.thesis_statement)
  const [portfolio_count, setPortfolioCount] = useState(String(initialData.portfolio_count ?? 0))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const result = await updateInvestorProfile({
      firm_name,
      partner_name,
      location,
      check_size_min_usd: Number(check_size_min_usd),
      check_size_max_usd: Number(check_size_max_usd),
      stages,
      leads_rounds,
      takes_board_seat: initialData.takes_board_seat,
      geography_focus,
      saas_subcategories,
      arr_sweet_spot_min: Number(arr_sweet_spot_min),
      arr_sweet_spot_max: Number(arr_sweet_spot_max),
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Firm name</label>
          <input
            type="text"
            value={firm_name}
            onChange={(e) => setFirmName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
          <input
            type="text"
            value={partner_name}
            onChange={(e) => setPartnerName(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check size min (USD)</label>
          <input
            type="number"
            value={check_size_min_usd}
            onChange={(e) => setCheckMin(e.target.value)}
            className={inputCls}
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check size max (USD)</label>
          <input
            type="number"
            value={check_size_max_usd}
            onChange={(e) => setCheckMax(e.target.value)}
            className={inputCls}
            min={0}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Stages you invest in</label>
        <MultiSelect
          options={STAGE_OPTIONS.map((s) => s.label)}
          selected={stages.map(
            (s) => STAGE_OPTIONS.find((o) => o.value === s)?.label ?? s
          )}
          onChange={(labels) =>
            setStages(
              labels
                .map((l) => STAGE_OPTIONS.find((o) => o.label === l)?.value)
                .filter(Boolean) as FounderStage[]
            )
          }
        />
      </div>

      <div>
        <Toggle
          checked={leads_rounds}
          onChange={setLeadsRounds}
          label="I lead rounds"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Geography focus</label>
        <input
          type="text"
          value={geography_focus}
          onChange={(e) => setGeographyFocus(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SaaS subcategories{' '}
          <span className="text-gray-400 font-normal">(minimum 3 required)</span>
        </label>
        <MultiSelect
          options={SAAS_SUBCATEGORIES}
          selected={saas_subcategories}
          onChange={setSaasSubcategories}
          minRequired={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ARR sweet spot min (USD)</label>
          <input
            type="number"
            value={arr_sweet_spot_min}
            onChange={(e) => setArrMin(e.target.value)}
            className={inputCls}
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ARR sweet spot max (USD)</label>
          <input
            type="number"
            value={arr_sweet_spot_max}
            onChange={(e) => setArrMax(e.target.value)}
            className={inputCls}
            min={0}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio companies</label>
        <input
          type="number"
          value={portfolio_count}
          onChange={(e) => setPortfolioCount(e.target.value)}
          className={inputCls}
          min={0}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Thesis{' '}
          <span className="text-gray-400 font-normal">(max 250 characters)</span>
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
