'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { flagFounderAsLender, unflagFounderAsLender } from '@/app/actions/discover'
import { fmtArrRange, fmtStage } from '@/lib/format'
import type { Database } from '@/lib/supabase/types'

type FounderProfileRow = Database['public']['Tables']['founder_profiles']['Row']
type LenderProfileRow = Database['public']['Tables']['lender_profiles']['Row']

type FounderWithProfile = FounderProfileRow & {
  profiles: { email: string }
}

interface Props {
  founders: FounderWithProfile[]
  myProfile: LenderProfileRow
  myFlaggedFounderIds: string[]
}

const STAGE_OPTIONS = ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c'] as const
const ARR_RANGE_OPTIONS = [
  { value: '', label: 'All' },
  { value: '0-500k', label: '$0 – $500K' },
  { value: '500k-2m', label: '$500K – $2M' },
  { value: '2m-5m', label: '$2M – $5M' },
  { value: '5m-plus', label: '$5M+' },
] as const
const GTM_OPTIONS = ['sales-led', 'product-led', 'hybrid'] as const
const PRODUCT_CATEGORIES = [
  'iPaaS', 'Vertical SaaS', 'DevTools', 'Security',
  'Data & Analytics', 'HR Tech', 'FinTech', 'MarTech', 'RevOps', 'Ed Tech', 'Other',
]

type FlagState = 'idle' | 'pending_undo' | 'flagged'

function computeMatchScore(
  founder: FounderProfileRow,
  myProfile: LenderProfileRow
): number {
  let score = 0
  if (myProfile.stages?.includes(founder.stage)) score += 2
  const overlap = (myProfile.saas_subcategories ?? []).filter((s) =>
    (founder.product_categories ?? []).includes(s)
  ).length
  score += Math.min(overlap, 2)
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

export default function LenderDiscoverClient({
  founders,
  myProfile,
  myFlaggedFounderIds,
}: Props) {
  const router = useRouter()

  const [arrRange, setArrRange] = useState('')
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [momGrowthMin, setMomGrowthMin] = useState('')
  const [selectedGtm, setSelectedGtm] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set(myFlaggedFounderIds))
  const [flagStates, setFlagStates] = useState<Record<string, FlagState>>({})
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set())
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const [expandedWhyNow, setExpandedWhyNow] = useState<Record<string, boolean>>({})

  function resetFilters() {
    setArrRange('')
    setSelectedStages([])
    setMomGrowthMin('')
    setSelectedGtm([])
    setSelectedCategories([])
  }

  function toggleStage(s: string) {
    setSelectedStages((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  function toggleGtm(g: string) {
    setSelectedGtm((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

  function toggleCategory(c: string) {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    )
  }

  const filtered = useMemo(() => {
    return founders
      .filter((f) => !passedIds.has(f.id))
      .filter((f) => {
        if (arrRange && f.arr_range !== arrRange) return false
        if (selectedStages.length > 0 && !selectedStages.includes(f.stage)) return false
        if (momGrowthMin && (f.mom_growth_pct == null || f.mom_growth_pct < Number(momGrowthMin))) return false
        if (selectedGtm.length > 0 && !selectedGtm.includes(f.gtm_motion)) return false
        if (selectedCategories.length > 0) {
          const hasCategory = selectedCategories.some((c) =>
            f.product_categories?.includes(c)
          )
          if (!hasCategory) return false
        }
        return true
      })
  }, [founders, passedIds, arrRange, selectedStages, momGrowthMin, selectedGtm, selectedCategories])

  async function handleFlag(founderId: string) {
    setFlaggedIds((prev) => new Set(Array.from(prev).concat(founderId)))
    setFlagStates((prev) => ({ ...prev, [founderId]: 'pending_undo' }))

    await flagFounderAsLender(founderId)

    const t = setTimeout(() => {
      setFlagStates((prev) => ({ ...prev, [founderId]: 'flagged' }))
    }, 5000)
    timeoutRefs.current[founderId] = t
  }

  async function handleUndo(founderId: string) {
    clearTimeout(timeoutRefs.current[founderId])
    delete timeoutRefs.current[founderId]
    setFlagStates((prev) => ({ ...prev, [founderId]: 'idle' }))
    setFlaggedIds((prev) => {
      const next = new Set(prev)
      next.delete(founderId)
      return next
    })
    await unflagFounderAsLender(founderId)
  }

  function handlePass(founderId: string) {
    setPassedIds((prev) => new Set(Array.from(prev).concat(founderId)))
  }

  const chipBtn = (active: boolean) =>
    `px-3 py-1 text-xs rounded-md border transition-colors ${
      active
        ? 'bg-[#534AB7] text-white border-[#534AB7]'
        : 'border-gray-200 text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7]'
    }`

  const inputCls =
    'border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent w-full'

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Discover Founders</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} founder{filtered.length !== 1 ? 's' : ''} match your filters
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="border border-gray-200 rounded-lg p-4 mb-8 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">ARR range</label>
            <select
              value={arrRange}
              onChange={(e) => setArrRange(e.target.value)}
              className={inputCls + ' bg-white'}
            >
              {ARR_RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">YOY growth min %</label>
            <input
              type="number"
              value={momGrowthMin}
              onChange={(e) => setMomGrowthMin(e.target.value)}
              className={inputCls}
              placeholder="10"
              min={0}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full text-xs text-[#534AB7] hover:text-[#4339A0] border border-[#534AB7] px-3 py-1.5 rounded-md transition-colors"
            >
              Reset filters
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Stage</p>
          <div className="flex flex-wrap gap-2">
            {STAGE_OPTIONS.map((s) => (
              <button key={s} type="button" onClick={() => toggleStage(s)} className={chipBtn(selectedStages.includes(s))}>
                {fmtStage(s)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">GTM motion</p>
          <div className="flex flex-wrap gap-2">
            {GTM_OPTIONS.map((g) => (
              <button key={g} type="button" onClick={() => toggleGtm(g)} className={chipBtn(selectedGtm.includes(g))}>
                {g.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Product category</p>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => toggleCategory(c)} className={chipBtn(selectedCategories.includes(c))}>
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
            No founders match your filters. Try widening your search.
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
          {filtered.map((f) => {
            const score = computeMatchScore(f, myProfile)
            const flagState = flagStates[f.id] ?? (flaggedIds.has(f.id) ? 'flagged' : 'idle')
            const isExpanded = expandedWhyNow[f.id] ?? false

            return (
              <div
                key={f.id}
                onClick={() => router.push(`/discover/${f.id}`)}
                className="border border-gray-200 rounded-lg p-5 cursor-pointer hover:border-[#534AB7] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    {f.website ? (
                      <a
                        href={f.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-semibold text-[#534AB7] hover:underline"
                      >
                        {f.company_name}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900">{f.company_name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {f.product_categories?.[0] ?? 'SaaS'} — {f.location}
                    </p>
                  </div>
                  <MatchBadge score={score} />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-purple-50 text-[#534AB7] px-2 py-0.5 rounded-full">
                    {fmtStage(f.stage)}
                  </span>
                  <span className="text-xs text-gray-500">Founded {f.founded_year}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div>
                    <p className="text-gray-400">ARR</p>
                    <p className="text-gray-700 font-medium">{fmtArrRange(f.arr_range)}</p>
                  </div>
                  {f.mom_growth_pct != null && (
                    <div>
                      <p className="text-gray-400">YOY growth</p>
                      <p className="text-gray-700 font-medium">{f.mom_growth_pct}%</p>
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      f.gtm_motion === 'product-led'
                        ? 'bg-blue-50 text-blue-700'
                        : f.gtm_motion === 'sales-led'
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {f.gtm_motion.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>

                {f.product_categories && f.product_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {f.product_categories.slice(0, 3).map((c) => (
                      <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {f.why_now && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-0.5">In their own words</p>
                    <p className={`text-xs text-gray-600 italic ${isExpanded ? '' : 'line-clamp-2'}`}>
                      &ldquo;{f.why_now}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedWhyNow((prev) => ({
                          ...prev,
                          [f.id]: !isExpanded,
                        }))
                      }}
                      className="text-xs text-[#534AB7] hover:text-[#4339A0] mt-1"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div
                  className="flex gap-2 mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handlePass(f.id)}
                    className="flex-1 text-sm py-2 rounded-md border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Pass
                  </button>

                  {flagState === 'idle' && (
                    <button
                      onClick={() => handleFlag(f.id)}
                      className="flex-1 text-sm py-2 rounded-md border border-[#534AB7] text-[#534AB7] hover:bg-[#534AB7] hover:text-white transition-colors"
                    >
                      Express interest
                    </button>
                  )}
                  {flagState === 'pending_undo' && (
                    <div className="flex-1 flex items-center gap-2">
                      <span className="flex-1 text-sm text-center text-green-600">
                        Flagged ✓
                      </span>
                      <button
                        onClick={() => handleUndo(f.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2.5 py-1 rounded-md transition-colors"
                      >
                        Undo
                      </button>
                    </div>
                  )}
                  {flagState === 'flagged' && (
                    <div className="flex-1 text-sm text-center text-green-600 py-2">
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
