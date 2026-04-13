'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { flagInvestor, unflagInvestor } from '@/app/actions/discover'
import { fmtUsd, fmtStage } from '@/lib/format'
import type { Database } from '@/lib/supabase/types'

type InvestorProfileRow = Database['public']['Tables']['investor_profiles']['Row']
type FounderProfileRow = Database['public']['Tables']['founder_profiles']['Row']

type InvestorWithProfile = InvestorProfileRow & {
  profiles: { email: string }
}

interface Props {
  investors: InvestorWithProfile[]
  myProfile: FounderProfileRow
  myFlaggedInvestorIds: string[]
}

const STAGE_OPTIONS = ['pre-seed', 'seed', 'series-a', 'series-b'] as const
const SAAS_SUBCATEGORIES = [
  'iPaaS', 'Vertical SaaS', 'DevTools', 'Security',
  'Data & Analytics', 'HR Tech', 'FinTech', 'MarTech', 'RevOps', 'Other',
]

type FlagState = 'idle' | 'pending_undo' | 'flagged'

function computeMatchScore(
  investor: InvestorProfileRow,
  myProfile: FounderProfileRow
): number {
  let score = 0
  // Stage match: 2pts
  if (investor.stages?.includes(myProfile.stage)) score += 2
  // SaaS subcategory overlap: up to 2pts
  const overlap = (investor.saas_subcategories ?? []).filter((s) =>
    (myProfile.product_categories ?? []).includes(s)
  ).length
  score += Math.min(overlap, 2)
  // Check size includes raising amount: 1pt
  if (
    myProfile.raising_amount_usd >= investor.check_size_min_usd &&
    myProfile.raising_amount_usd <= investor.check_size_max_usd
  ) {
    score += 1
  }
  return score
}

function MatchBadge({ score }: { score: number }) {
  if (score >= 4) {
    return (
      <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
        Strong match
      </span>
    )
  }
  if (score >= 2) {
    return (
      <span className="text-xs font-medium bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
        Partial match
      </span>
    )
  }
  return (
    <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
      Low match
    </span>
  )
}

function FlagDots({ used }: { used: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 mr-1">{used} / 10 flags used</span>
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${i < used ? 'bg-[#534AB7]' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

export default function FounderDiscoverClient({
  investors,
  myProfile,
  myFlaggedInvestorIds,
}: Props) {
  const router = useRouter()

  // Filter state
  const [checkMin, setCheckMin] = useState('')
  const [checkMax, setCheckMax] = useState('')
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [leadsOnly, setLeadsOnly] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Flags state
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set(myFlaggedInvestorIds))
  const [flagStates, setFlagStates] = useState<Record<string, FlagState>>({})
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Per-card thesis expand state
  const [expandedThesis, setExpandedThesis] = useState<Record<string, boolean>>({})

  const flagsUsed = flaggedIds.size

  function resetFilters() {
    setCheckMin('')
    setCheckMax('')
    setSelectedStages([])
    setLeadsOnly(false)
    setSelectedCategories([])
  }

  function toggleStage(s: string) {
    setSelectedStages((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  function toggleCategory(c: string) {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    )
  }

  const filtered = useMemo(() => {
    return investors.filter((inv) => {
      if (checkMin && inv.check_size_max_usd < Number(checkMin)) return false
      if (checkMax && inv.check_size_min_usd > Number(checkMax)) return false
      if (selectedStages.length > 0) {
        const hasStage = selectedStages.some((s) => inv.stages?.includes(s as never))
        if (!hasStage) return false
      }
      if (leadsOnly && !inv.leads_rounds) return false
      if (selectedCategories.length > 0) {
        const hasCategory = selectedCategories.some((c) =>
          inv.saas_subcategories?.includes(c)
        )
        if (!hasCategory) return false
      }
      return true
    })
  }, [investors, checkMin, checkMax, selectedStages, leadsOnly, selectedCategories])

  async function handleFlag(investorId: string) {
    if (flagsUsed >= 10) return
    setFlaggedIds((prev) => new Set(Array.from(prev).concat(investorId)))
    setFlagStates((prev) => ({ ...prev, [investorId]: 'pending_undo' }))

    await flagInvestor(investorId)
    router.refresh()

    const t = setTimeout(() => {
      setFlagStates((prev) => ({ ...prev, [investorId]: 'flagged' }))
    }, 5000)
    timeoutRefs.current[investorId] = t
  }

  async function handleUndo(investorId: string) {
    clearTimeout(timeoutRefs.current[investorId])
    delete timeoutRefs.current[investorId]
    setFlagStates((prev) => ({ ...prev, [investorId]: 'idle' }))
    setFlaggedIds((prev) => {
      const next = new Set(prev)
      next.delete(investorId)
      return next
    })
    await unflagInvestor(investorId)
    router.refresh()
  }

  const inputCls =
    'border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent w-full'

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Discover Investors</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} investor{filtered.length !== 1 ? 's' : ''} match your filters</p>
        </div>
        <FlagDots used={flagsUsed} />
      </div>

      {/* Filter bar */}
      <div className="border border-gray-200 rounded-lg p-4 mb-8 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Check size min (USD)</label>
            <input
              type="number"
              value={checkMin}
              onChange={(e) => setCheckMin(e.target.value)}
              className={inputCls}
              placeholder="500000"
              min={0}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Check size max (USD)</label>
            <input
              type="number"
              value={checkMax}
              onChange={(e) => setCheckMax(e.target.value)}
              className={inputCls}
              placeholder="5000000"
              min={0}
            />
          </div>
          <div className="col-span-2 flex items-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={leadsOnly}
                onChange={(e) => setLeadsOnly(e.target.checked)}
                className="rounded border-gray-300 text-[#534AB7]"
              />
              <span className="text-sm text-gray-700">Leads rounds only</span>
            </label>
            <button
              onClick={resetFilters}
              className="ml-auto text-xs text-[#534AB7] hover:text-[#4339A0] border border-[#534AB7] px-3 py-1.5 rounded-md transition-colors"
            >
              Reset filters
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Stage</p>
          <div className="flex flex-wrap gap-2">
            {STAGE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleStage(s)}
                className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                  selectedStages.includes(s)
                    ? 'bg-[#534AB7] text-white border-[#534AB7]'
                    : 'border-gray-200 text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7]'
                }`}
              >
                {fmtStage(s)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">SaaS subcategory</p>
          <div className="flex flex-wrap gap-2">
            {SAAS_SUBCATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                  selectedCategories.includes(c)
                    ? 'bg-[#534AB7] text-white border-[#534AB7]'
                    : 'border-gray-200 text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-3">
            No investors match your filters. Try widening your search.
          </p>
          <button
            onClick={resetFilters}
            className="text-sm text-[#534AB7] hover:text-[#4339A0] border border-[#534AB7] px-4 py-2 rounded-md transition-colors"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((inv) => {
            const score = computeMatchScore(inv, myProfile)
            const flagState = flagStates[inv.id] ?? (flaggedIds.has(inv.id) ? 'flagged' : 'idle')
            const isThesisExpanded = expandedThesis[inv.id] ?? false

            return (
              <div
                key={inv.id}
                onClick={() => router.push(`/discover/${inv.id}`)}
                className="border border-gray-200 rounded-lg p-5 cursor-pointer hover:border-[#534AB7] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{inv.firm_name}</p>
                    <p className="text-xs text-gray-500">{inv.partner_name}</p>
                    <p className="text-xs text-gray-400">{inv.location}</p>
                  </div>
                  <MatchBadge score={score} />
                </div>

                <p className="text-xs text-gray-700 font-medium mb-2">
                  {fmtUsd(inv.check_size_min_usd)} – {fmtUsd(inv.check_size_max_usd)}
                </p>

                {/* Stage badges */}
                {inv.stages && inv.stages.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {inv.stages.map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-purple-50 text-[#534AB7] px-2 py-0.5 rounded-full"
                      >
                        {fmtStage(s)}
                      </span>
                    ))}
                  </div>
                )}

                {/* SaaS subcategory chips */}
                {inv.saas_subcategories && inv.saas_subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {inv.saas_subcategories.slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Thesis */}
                {inv.thesis_statement && (
                  <div className="mb-3">
                    <p
                      className={`text-xs text-gray-600 italic ${isThesisExpanded ? '' : 'line-clamp-2'}`}
                    >
                      &ldquo;{inv.thesis_statement}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedThesis((prev) => ({
                          ...prev,
                          [inv.id]: !isThesisExpanded,
                        }))
                      }}
                      className="text-xs text-[#534AB7] hover:text-[#4339A0] mt-1"
                    >
                      {isThesisExpanded ? 'Show less' : 'Read more'}
                    </button>
                  </div>
                )}

                {/* Flag button */}
                <div onClick={(e) => e.stopPropagation()}>
                  {flagState === 'idle' && (
                    <button
                      onClick={() => handleFlag(inv.id)}
                      disabled={flagsUsed >= 10}
                      className={`w-full text-sm py-2 rounded-md border transition-colors ${
                        flagsUsed >= 10
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-[#534AB7] text-[#534AB7] hover:bg-[#534AB7] hover:text-white'
                      }`}
                    >
                      {flagsUsed >= 10 ? 'Flag limit reached' : 'Flag interest'}
                    </button>
                  )}
                  {flagState === 'pending_undo' && (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-center text-green-600">
                        Flagged ✓
                      </span>
                      <button
                        onClick={() => handleUndo(inv.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2.5 py-1 rounded-md transition-colors"
                      >
                        Undo
                      </button>
                    </div>
                  )}
                  {flagState === 'flagged' && (
                    <div className="text-sm text-center text-green-600 py-2">
                      Flagged ✓
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
