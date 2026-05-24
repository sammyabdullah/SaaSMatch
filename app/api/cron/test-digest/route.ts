import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMonthlyFounderDigest, sendMonthlyInvestorDigest, sendMonthlyLenderDigest } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'Missing ?email=' }, { status: 400 })

  const admin = createAdminClient()

  const [
    { data: founders },
    { data: investors },
    { data: lenders },
    { data: investorFlags },
    { data: lenderFlags },
    { count: investorCount },
    { count: lenderCount },
    { data: latestInvestors },
    { data: latestLenders },
    { data: acceptedInvConn },
    { data: acceptedLenConn },
  ] = await Promise.all([
    admin.from('founder_profiles').select('id, stage, product_categories, company_name').eq('is_approved', true).eq('status', 'active').limit(1),
    admin.from('investor_profiles').select('id, firm_name, partner_name, stages, saas_subcategories').eq('is_approved', true).limit(5),
    admin.from('lender_profiles').select('id, institution_name, contact_name, stages').eq('is_approved', true).limit(3),
    admin.from('flags').select('founder_id, investor_id').in('status', ['pending', 'accepted']),
    admin.from('lender_flags').select('founder_id, lender_id').in('status', ['pending', 'accepted']),
    admin.from('investor_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('lender_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('investor_profiles').select('firm_name, partner_name').eq('is_approved', true).order('created_at', { ascending: false }).limit(5),
    admin.from('lender_profiles').select('institution_name, contact_name').eq('is_approved', true).order('created_at', { ascending: false }).limit(5),
    admin.from('flags').select('founder_id, investor_id, responded_at').eq('status', 'accepted').order('responded_at', { ascending: false }).limit(10),
    admin.from('lender_flags').select('founder_id, lender_id, responded_at').eq('status', 'accepted').order('responded_at', { ascending: false }).limit(10),
  ])

  // Targeted name lookups for the actual connection IDs
  const invConnIds = (acceptedInvConn ?? []).map((c) => c.investor_id)
  const lenConnIds = (acceptedLenConn ?? []).map((c) => c.lender_id)
  const fdrConnIds = Array.from(new Set([
    ...(acceptedInvConn ?? []).map((c) => c.founder_id),
    ...(acceptedLenConn ?? []).map((c) => c.founder_id),
  ]))

  const [{ data: connInvestors }, { data: connLenders }, { data: connFounders }] = await Promise.all([
    invConnIds.length > 0 ? admin.from('investor_profiles').select('id, firm_name').in('id', invConnIds) : { data: [] },
    lenConnIds.length > 0 ? admin.from('lender_profiles').select('id, institution_name').in('id', lenConnIds) : { data: [] },
    fdrConnIds.length > 0 ? admin.from('founder_profiles').select('id, company_name').in('id', fdrConnIds) : { data: [] },
  ])

  const investorNameMap = Object.fromEntries((connInvestors ?? []).map((i) => [i.id, i.firm_name]))
  const lenderNameMap = Object.fromEntries((connLenders ?? []).map((l) => [l.id, l.institution_name]))
  const founderNameMap = Object.fromEntries((connFounders ?? []).map((f) => [f.id, f.company_name]))

  const investorPairs = new Set((investorFlags ?? []).map((f) => `${f.founder_id}:${f.investor_id}`))
  const lenderPairs = new Set((lenderFlags ?? []).map((f) => `${f.founder_id}:${f.lender_id}`))

  type ConnRow = { date: string; left: string; right: string }
  const latestConnections = [
    ...(acceptedInvConn ?? []).map((c): ConnRow => ({ date: c.responded_at ?? '', left: investorNameMap[c.investor_id] ?? 'An investor', right: founderNameMap[c.founder_id] ?? 'A founder' })),
    ...(acceptedLenConn ?? []).map((c): ConnRow => ({ date: c.responded_at ?? '', left: lenderNameMap[c.lender_id] ?? 'A lender', right: founderNameMap[c.founder_id] ?? 'A founder' })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(({ left, right }) => ({ left, right }))

  const platformStats = {
    investorCount: investorCount ?? 0,
    lenderCount: lenderCount ?? 0,
    latestInvestors: (latestInvestors ?? []) as { firm_name: string; partner_name: string }[],
    latestLenders: (latestLenders ?? []) as { institution_name: string; contact_name: string }[],
    latestConnections,
  }

  const founder = founders?.[0]
  const investor = investors?.[0]
  const lender = lenders?.[0]

  try {
    // Send founder-style test
    if (founder) {
      const matchingInvestors = (investors ?? []).filter((inv) => {
        if (investorPairs.has(`${founder.id}:${inv.id}`)) return false
        const stageMatch = (inv.stages as string[] ?? []).includes(founder.stage as string)
        const categoryOverlap = (inv.saas_subcategories ?? []).some((s: string) => (founder.product_categories ?? []).includes(s))
        return stageMatch && categoryOverlap
      })
      const matchingLenders = (lenders ?? []).filter((l) => {
        if (lenderPairs.has(`${founder.id}:${l.id}`)) return false
        return (l.stages ?? []).includes(founder.stage as string)
      })
      await sendMonthlyFounderDigest({
        founderEmail: email,
        matchingInvestors: matchingInvestors.map((inv) => ({ firm_name: inv.firm_name, partner_name: inv.partner_name })),
        matchingLenders: matchingLenders.map((l) => ({ institution_name: l.institution_name, contact_name: l.contact_name })),
        platformStats,
      })
    }

    // Send investor-style test
    if (investor) {
      const matchingFounders = (founders ?? []).filter((f) => {
        if (investorPairs.has(`${f.id}:${investor.id}`)) return false
        const stageMatch = (investor.stages as string[] ?? []).includes(f.stage as string)
        const categoryOverlap = (investor.saas_subcategories ?? []).some((s: string) => (f.product_categories ?? []).includes(s))
        return stageMatch && categoryOverlap
      })
      await sendMonthlyInvestorDigest({
        investorEmail: email,
        matchingFounders: matchingFounders.map((f) => ({ company_name: f.company_name, stage: f.stage as string, product_categories: (f.product_categories ?? []) as string[] })),
        platformStats,
      })
    }

    // Send lender-style test
    if (lender) {
      const matchingFounders = (founders ?? []).filter((f) => {
        if (lenderPairs.has(`${f.id}:${lender.id}`)) return false
        return (lender.stages ?? []).includes(f.stage as string)
      })
      await sendMonthlyLenderDigest({
        lenderEmail: email,
        matchingFounders: matchingFounders.map((f) => ({ company_name: f.company_name, stage: f.stage as string, product_categories: (f.product_categories ?? []) as string[] })),
        platformStats,
      })
    }
  } catch (err) {
    console.error('[cron/test-digest] send failed:', err)
    return NextResponse.json({ error: 'Email send failed', detail: String(err) }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sentFounder: !!founder, sentInvestor: !!investor, sentLender: !!lender })
}
