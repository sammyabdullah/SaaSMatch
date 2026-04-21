/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { flagInvestor, unflagInvestor, flagLenderAsFounder, unflagLenderAsFounder } from '@/app/actions/discover'
import { fmtUsd, fmtStage } from '@/lib/format'

type FlagState = 'idle' | 'pending_undo' | 'flagged'
type TypeFilter = 'all' | 'investor' | 'lender'

interface Props {
  investors: any[]
  lenders: any[]
  myProfile: any
  myFlaggedInvestorIds: string[]
  myFlaggedLenderIds: string[]
}

const STAGE_OPTIONS = ['pre-seed', 'seed', 'series-a', 'series-b'] as const
const SAAS_SUBCATEGORIES = [
  'iPaaS', 'Vertical SaaS', 'DevTools', 'Security',
  'Data & Analytics', 'HR Tech', 'FinTech', 'MarTech', 'RevOps', 'Other',
]

function computeInvestorScore(inv: any, myProfile: any): number {
  let score = 0
  if (inv.stages?.includes(myProfile.stage)) score += 2
  const overlap = (inv.saas_subcategories ?? []).filter((s: string) =>
    (myProfile.product_categories ?? []).includes(s)
  ).length
  score += Math.min(overlap, 2)
  if (myProfile.raising_amount_usd >= inv.check_size_min_usd &&
      myProfile.raising_amount_usd <= inv.check_size_max_usd) score += 1
  return score
}

function computeLenderScore(lender: any, myProfile: any): number {
  let score = 0
  if (lender.stages?.includes(myProfile.stage)) score += 2
  const overlap = (lender.saas_subcategories ?? []).filter((s: string) =>
    (myProfile.product_categories ?? []).includes(s)
  ).length
  score += Math.min(overlap, 2)
  return score
}

function MatchBadge({ score }: { score: number }) {
  if (score >= 4) return (
    <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Strong match</span>
  )
  if (score >= 2) return (
    <span className="text-xs font-medium bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">Partial match</span>
  )
  return (
    <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Low match</span>
  )
}

function FlagDots({ used }: { used: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 mr-1">{used} / 25 requests sent</span>
      {Array.from({ length: 25 }).map((_, i) => (
        <span key={i} className={`w-2 h-2 rounded-full ${i < used ? 'bg-[#534AB7]' : 'bg-gray-200'}`} />
      ))}
    </div>
  )
}

export default function FounderDiscoverClient({
  investors,
  lenders,
  myProfile,
  myFlaggedInvestorIds,
  myFlaggedLenderIds,
}: Props) {
  const router = useRouter()

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [checkMin, setCheckMin] = useState('')
  const [checkMax, setCheckMax] = useState('')
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [leadsOnly, setLeadsOnly] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const [investorFlaggedIds, setInvestorFlaggedIds] = useState<Set<string>>(new Set(myFlaggedInvestorIds))
  const [lenderFlaggedIds, setLenderFlaggedIds] = useState<Set<string>>(new Set(myFlaggedLenderIds))
  const [flagStates, setFlagStates] = useState<Record<string, FlagState>>({})
  const [flagErrors, setFlagErrors] = useState<Record<string, string>>({})
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const [expandedThesis, setExpandedThesis] = useState<Record<string, boolean>>({})

  const investorFlagsUsed = investorFlaggedIds.size

  function resetFilters() {
    setTypeFilter('all')
    setCheckMin('')
    setCheckMax('')
    setSelectedStages([])
    setLeadsOnly(false)
    setSelectedCategories([])
  }

  function toggleStage(s: string) {
    setSelectedStages((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function toggleCategory(c: string) {
    setSelectedCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
  }

  const filteredInvestors = useMemo(() => {
    if (typeFilter === 'lender') return []
    return investors.filter((inv) => {
      if (checkMin && inv.check_size_max_usd < Number(checkMin)) return false
      if (checkMax && inv.check_size_min_usd > Number(checkMax)) return false
      if (selectedStages.length > 0 && !selectedStages.some((s) => inv.stages?.includes(s))) return false
      if (leadsOnly && !inv.leads_rounds) return false
      if (selectedCategories.length > 0 && !selectedCategories.some((c) => inv.saas_subcategories?.includes(c))) return false
      return true
    })
  }, [investors, typeFilter, checkMin, checkMax, selectedStages, leadsOnly, selectedCategories])

  const filteredLenders = useMemo(() => {
    if (typeFilter === 'investor') return []
    return lenders.filter((lender) => {
      if (selectedStages.length > 0 && !selectedStages.some((s) => lender.stages?.includes(s))) return false
      if (selectedCategories.length > 0 && !selectedCategories.some((c) => lender.saas_subcategories?.includes(c))) return false
      return true
    })
  }, [lenders, typeFilter, selectedStages, selectedCategories])

  // Merge and sort by match score descending, lenders mixed in naturally
  const merged = useMemo(() => {
    const inv = filteredInvestors.map((i: any) => ({ ...i, _type: 'investor' as const, _score: computeInvestorScore(i, myProfile) }))
    const len = filteredLenders.map((l: any) => ({ ...l, _type: 'lender' as const, _score: computeLenderScore(l, myProfile) }))
    return [...inv, ...len].sort((a, b) => b._score - a._score)
  }, [filteredInvestors, filteredLenders, myProfile])

  async function handleInvestorFlag(investorId: string) {
    if (investorFlagsUsed >= 25) return
    setInvestorFlaggedIds((prev) => new Set(Array.from(prev).concat(investorId)))
    setFlagStates((prev) => ({ ...prev, [investorId]: 'pending_undo' }))
    setFlagErrors((prev) => ({ ...prev, [investorId]: '' }))
    const result = await flagInvestor(investorId)
    if (result?.error) {
      setInvestorFlaggedIds((prev) => { const next = new Set(prev); next.delete(investorId); return next })
      setFlagStates((prev) => ({ ...prev, [investorId]: 'idle' }))
      setFlagErrors((prev) => ({ ...prev, [investorId]: result.error! }))
      return
    }
    router.refresh()
    const t = setTimeout(() => setFlagStates((prev) => ({ ...prev, [investorId]: 'flagged' })), 5000)
    timeoutRefs.current[investorId] = t
  }

  async function handleInvestorUndo(investorId: string) {
    clearTimeout(timeoutRefs.current[investorId])
    delete timeoutRefs.current[investorId]
    setFlagStates((prev) => ({ ...prev, [investorId]: 'idle' }))
    setInvestorFlaggedIds((prev) => { const next = new Set(prev); next.delete(investorId); return next })
    await unflagInvestor(investorId)
    router.refresh()
  }

  async function handleLenderFlag(lenderId: string) {
    setLenderFlaggedIds((prev) => new Set(Array.from(prev).concat(lenderId)))
    setFlagStates((prev) => ({ ...prev, [lenderId]: 'pending_undo' }))
    setFlagErrors((prev) => ({ ...prev, [lenderId]: '' }))
    const result = await flagLenderAsFounder(lenderId)
    if (result?.error) {
      setLenderFlaggedIds((prev) => { const next = new Set(prev); next.delete(lenderId); return next })
      setFlagStates((prev) => ({ ...prev, [lenderId]: 'idle' }))
      setFlagErrors((prev) => ({ ...prev, [lenderId]: result.error! }))
      return
    }
    router.refresh()
    const t = setTimeout(() => setFlagStates((prev) => ({ ...prev, [lenderId]: 'flagged' })), 5000)
    timeoutRefs.current[lenderId] = t
  }

  async function handleLenderUndo(lenderId: string) {
    clearTimeout(timeoutRefs.current[lenderId])
    delete timeoutRefs.current[lenderId]
    setFlagStates((prev) => ({ ...prev, [lenderId]: 'idle' }))
    setLenderFlaggedIds((prev) => { const next = new Set(prev); next.delete(lenderId); return next })
    await unflagLenderAsFounder(lenderId)
    router.refresh()
  }

  const inputCls = 'border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#534AB7] focus:border-transparent w-full'

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Discover</h1>
          <p className="text-sm text-gray-500 mt-1">{merged.length} {merged.length !== 1 ? 'matches' : 'match'}</p>
        </div>
        <FlagDots used={investorFlagsUsed} />
      </div>

      {/* Filter bar */}
      <div className="border border-gray-200 rounded-lg p-4 mb-8 space-y-4">
        {/* Type filter */}
        <div className="flex gap-2">
          {(['all', 'investor', 'lender'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                typeFilter === t
                  ? 'bg-[#534AB7] text-white border-[#534AB7]'
                  : 'border-gray-200 text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7]'
              }`}
            >
              {t === 'all' ? 'All' : t === 'investor' ? 'Investors' : 'Lenders'}
            </button>
          ))}
        </div>

        {/* Investor-specific filters */}
        {typeFilter !== 'lender' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Check size min (USD)</label>
              <input type="number" value={checkMin} onChange={(e) => setCheckMin(e.target.value)} className={inputCls} placeholder="500000" min={0} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Check size max (USD)</label>
              <input type="number" value={checkMax} onChange={(e) => setCheckMax(e.target.value)} className={inputCls} placeholder="5000000" min={0} />
            </div>
            <div className="col-span-2 flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={leadsOnly} onChange={(e) => setLeadsOnly(e.target.checked)} className="rounded border-gray-300 text-[#534AB7]" />
                <span className="text-sm text-gray-700">Leads rounds only</span>
              </label>
              <button onClick={resetFilters} className="ml-auto text-xs text-[#534AB7] hover:text-[#4339A0] border border-[#534AB7] px-3 py-1.5 rounded-md transition-colors">
                Reset filters
              </button>
            </div>
          </div>
        )}

        {typeFilter === 'lender' && (
          <div className="flex justify-end">
            <button onClick={resetFilters} className="text-xs text-[#534AB7] hover:text-[#4339A0] border border-[#534AB7] px-3 py-1.5 rounded-md transition-colors">
              Reset filters
            </button>
          </div>
        )}

        {/* Stage filter */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Stage</p>
          <div className="flex flex-wrap gap-2">
            {STAGE_OPTIONS.map((s) => (
              <button key={s} type="button" onClick={() => toggleStage(s)}
                className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                  selectedStages.includes(s) ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'border-gray-200 text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7]'
                }`}>
                {fmtStage(s)}
              </button>
            ))}
          </div>
        </div>

        {/* SaaS subcategory filter */}
        <div>
          <p className="text-xs text-gray-500 mb-2">SaaS subcategory</p>
          <div className="flex flex-wrap gap-2">
            {SAAS_SUBCATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => toggleCategory(c)}
                className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                  selectedCategories.includes(c) ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'border-gray-200 text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7]'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {merged.length === 0 ? (
        <div className="text-center py-16 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-3">No matches for your current filters.</p>
          <button onClick={resetFilters} className="text-sm text-[#534AB7] hover:text-[#4339A0] border border-[#534AB7] px-4 py-2 rounded-md transition-colors">
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {merged.map((item) => {
            const id = item.id
            const isThesisExpanded = expandedThesis[id] ?? false

            if (item._type === 'investor') {
              const inv = item
              const flagState = flagStates[id] ?? (investorFlaggedIds.has(id) ? 'flagged' : 'idle')
              return (
                <div key={id} onClick={() => router.push(`/discover/${id}`)}
                  className="border border-gray-200 rounded-lg p-5 cursor-pointer hover:border-[#534AB7] transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{inv.firm_name}</p>
                      <p className="text-xs text-gray-500">{inv.partner_name}</p>
                      <p className="text-xs text-gray-400">{inv.location}</p>
                    </div>
                    <MatchBadge score={inv._score} />
                  </div>

                  <p className="text-xs text-gray-700 font-medium mb-2">
                    {fmtUsd(inv.check_size_min_usd)} – {fmtUsd(inv.check_size_max_usd)}
                  </p>

                  {inv.stages?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {inv.stages.map((s: string) => (
                        <span key={s} className="text-xs bg-purple-50 text-[#534AB7] px-2 py-0.5 rounded-full">{fmtStage(s)}</span>
                      ))}
                    </div>
                  )}

                  {inv.saas_subcategories?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {inv.saas_subcategories.slice(0, 3).map((c: string) => (
                        <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}

                  {inv.thesis_statement && (
                    <div className="mb-3">
                      <p className={`text-xs text-gray-600 italic ${isThesisExpanded ? '' : 'line-clamp-2'}`}>
                        &ldquo;{inv.thesis_statement}&rdquo;
                      </p>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setExpandedThesis((prev) => ({ ...prev, [id]: !isThesisExpanded })) }}
                        className="text-xs text-[#534AB7] hover:text-[#4339A0] mt-1">
                        {isThesisExpanded ? 'Show less' : 'Read more'}
                      </button>
                    </div>
                  )}

                  <div onClick={(e) => e.stopPropagation()}>
                    {flagErrors[id] && <p className="text-xs text-red-500 mb-1">{flagErrors[id]}</p>}
                    {flagState === 'idle' && (
                      <button onClick={() => handleInvestorFlag(id)} disabled={investorFlagsUsed >= 25}
                        className={`w-full text-sm py-2 rounded-md border transition-colors ${investorFlagsUsed >= 25 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-[#534AB7] text-[#534AB7] hover:bg-[#534AB7] hover:text-white'}`}>
                        {investorFlagsUsed >= 25 ? 'Limit reached' : 'Send connection request'}
                      </button>
                    )}
                    {flagState === 'pending_undo' && (
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm text-center text-green-600">Flagged ✓</span>
                        <button onClick={() => handleInvestorUndo(id)} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2.5 py-1 rounded-md transition-colors">Undo</button>
                      </div>
                    )}
                    {flagState === 'flagged' && <div className="text-sm text-center text-green-600 py-2">Flagged ✓</div>}
                  </div>
                </div>
              )
            }

            // Lender card
            const lender = item
            const flagState = flagStates[id] ?? (lenderFlaggedIds.has(id) ? 'flagged' : 'idle')
            return (
              <div key={id} className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900">{lender.institution_name}</p>
                      <span className="text-xs font-medium bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-full">Lender</span>
                    </div>
                    <p className="text-xs text-gray-500">{lender.contact_name}</p>
                    <p className="text-xs text-gray-400">{lender.location}</p>
                  </div>
                  <MatchBadge score={lender._score} />
                </div>

                <p className="text-xs text-gray-700 font-medium mb-2">
                  {fmtUsd(lender.loan_size_min_usd)} – {fmtUsd(lender.loan_size_max_usd)} loan
                </p>

                {lender.stages?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {lender.stages.map((s: string) => (
                      <span key={s} className="text-xs bg-purple-50 text-[#534AB7] px-2 py-0.5 rounded-full">{fmtStage(s)}</span>
                    ))}
                  </div>
                )}

                {lender.saas_subcategories?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {lender.saas_subcategories.slice(0, 3).map((c: string) => (
                      <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                )}

                {lender.thesis_statement && (
                  <div className="mb-3">
                    <p className={`text-xs text-gray-600 italic ${isThesisExpanded ? '' : 'line-clamp-2'}`}>
                      &ldquo;{lender.thesis_statement}&rdquo;
                    </p>
                    <button type="button" onClick={() => setExpandedThesis((prev) => ({ ...prev, [id]: !isThesisExpanded }))}
                      className="text-xs text-[#534AB7] hover:text-[#4339A0] mt-1">
                      {isThesisExpanded ? 'Show less' : 'Read more'}
                    </button>
                  </div>
                )}

                <div>
                  {flagErrors[id] && <p className="text-xs text-red-500 mb-1">{flagErrors[id]}</p>}
                  {flagState === 'idle' && (
                    <button onClick={() => handleLenderFlag(id)}
                      className="w-full text-sm py-2 rounded-md border border-sky-500 text-sky-600 hover:bg-sky-500 hover:text-white transition-colors">
                      Express interest
                    </button>
                  )}
                  {flagState === 'pending_undo' && (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-sm text-center text-green-600">Sent ✓</span>
                      <button onClick={() => handleLenderUndo(id)} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2.5 py-1 rounded-md transition-colors">Undo</button>
                    </div>
                  )}
                  {flagState === 'flagged' && <div className="text-sm text-center text-green-600 py-2">Sent ✓</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
