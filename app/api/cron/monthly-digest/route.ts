import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMonthlyFounderDigest, sendMonthlyInvestorDigest, sendMonthlyLenderDigest } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only run on the 2nd Wednesday of the month (day 8–14)
  const today = new Date()
  const dayOfMonth = today.getUTCDate()
  if (dayOfMonth < 8 || dayOfMonth > 14) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'Not the 2nd Wednesday' })
  }

  const admin = createAdminClient()

  // Fetch all data in parallel
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
    admin.from('founder_profiles')
      .select('id, stage, product_categories, company_name, profiles(email)')
      .eq('is_approved', true)
      .eq('status', 'active'),
    admin.from('investor_profiles')
      .select('id, firm_name, partner_name, stages, saas_subcategories, profiles(email)')
      .eq('is_approved', true),
    admin.from('lender_profiles')
      .select('id, institution_name, contact_name, stages, profiles(email)')
      .eq('is_approved', true),
    admin.from('flags').select('founder_id, investor_id').in('status', ['pending', 'accepted']),
    admin.from('lender_flags').select('founder_id, lender_id').in('status', ['pending', 'accepted']),
    admin.from('investor_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('lender_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('investor_profiles').select('firm_name, partner_name').eq('is_approved', true).order('created_at', { ascending: false }).limit(5),
    admin.from('lender_profiles').select('institution_name, contact_name').eq('is_approved', true).order('created_at', { ascending: false }).limit(5),
    admin.from('flags').select('founder_id, investor_id, responded_at').eq('status', 'accepted').order('responded_at', { ascending: false }).limit(10),
    admin.from('lender_flags').select('founder_id, lender_id, responded_at').eq('status', 'accepted').order('responded_at', { ascending: false }).limit(10),
  ])

  // Build existing-connection lookup sets
  const investorPairs = new Set((investorFlags ?? []).map((f) => `${f.founder_id}:${f.investor_id}`))
  const lenderPairs = new Set((lenderFlags ?? []).map((f) => `${f.founder_id}:${f.lender_id}`))

  // Build name maps for latest connections
  const investorNameMap = Object.fromEntries((investors ?? []).map((i) => [i.id, i.firm_name]))
  const lenderNameMap = Object.fromEntries((lenders ?? []).map((l) => [l.id, l.institution_name]))
  const founderNameMap = Object.fromEntries((founders ?? []).map((f) => [f.id, f.company_name]))

  type ConnRow = { date: string; left: string; right: string }
  const latestConnections = [
    ...(acceptedInvConn ?? []).map((c): ConnRow => ({
      date: c.responded_at ?? '',
      left: investorNameMap[c.investor_id] ?? 'An investor',
      right: founderNameMap[c.founder_id] ?? 'A founder',
    })),
    ...(acceptedLenConn ?? []).map((c): ConnRow => ({
      date: c.responded_at ?? '',
      left: lenderNameMap[c.lender_id] ?? 'A lender',
      right: founderNameMap[c.founder_id] ?? 'A founder',
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)
    .map(({ left, right }) => ({ left, right }))

  const platformStats = {
    investorCount: investorCount ?? 0,
    lenderCount: lenderCount ?? 0,
    latestInvestors: (latestInvestors ?? []) as { firm_name: string; partner_name: string }[],
    latestLenders: (latestLenders ?? []) as { institution_name: string; contact_name: string }[],
    latestConnections,
  }

  let emailsSent = 0

  // ── Founder digests ─────────────────────────────────────────────────────────
  for (const founder of founders ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const founderEmail = (founder as any).profiles?.email as string | undefined
    if (!founderEmail) continue

    const matchingInvestors = (investors ?? []).filter((inv) => {
      if (investorPairs.has(`${founder.id}:${inv.id}`)) return false
      const stageMatch = (inv.stages as string[] ?? []).includes(founder.stage as string)
      const categoryOverlap = (inv.saas_subcategories ?? []).some((s: string) =>
        (founder.product_categories ?? []).includes(s)
      )
      return stageMatch && categoryOverlap
    })

    const matchingLenders = (lenders ?? []).filter((lender) => {
      if (lenderPairs.has(`${founder.id}:${lender.id}`)) return false
      return (lender.stages ?? []).includes(founder.stage as string)
    })

    if (matchingInvestors.length === 0 && matchingLenders.length === 0) continue

    await sendMonthlyFounderDigest({
      founderEmail,
      matchingInvestors: matchingInvestors.map((inv) => ({
        firm_name: inv.firm_name,
        partner_name: inv.partner_name,
      })),
      matchingLenders: matchingLenders.map((l) => ({
        institution_name: l.institution_name,
        contact_name: l.contact_name,
      })),
      platformStats,
    })
    emailsSent++
  }

  // ── Investor digests ─────────────────────────────────────────────────────────
  for (const investor of investors ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const investorEmail = (investor as any).profiles?.email as string | undefined
    if (!investorEmail) continue

    const matchingFounders = (founders ?? []).filter((founder) => {
      if (investorPairs.has(`${founder.id}:${investor.id}`)) return false
      const stageMatch = (investor.stages as string[] ?? []).includes(founder.stage as string)
      const categoryOverlap = (investor.saas_subcategories ?? []).some((s: string) =>
        (founder.product_categories ?? []).includes(s)
      )
      return stageMatch && categoryOverlap
    })

    if (matchingFounders.length === 0) continue

    await sendMonthlyInvestorDigest({
      investorEmail,
      matchingFounders: matchingFounders.map((f) => ({
        company_name: f.company_name,
        stage: f.stage as string,
        product_categories: (f.product_categories ?? []) as string[],
      })),
      platformStats,
    })
    emailsSent++
  }

  // ── Lender digests ───────────────────────────────────────────────────────────
  for (const lender of lenders ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lenderEmail = (lender as any).profiles?.email as string | undefined
    if (!lenderEmail) continue

    const matchingFounders = (founders ?? []).filter((founder) => {
      if (lenderPairs.has(`${founder.id}:${lender.id}`)) return false
      return (lender.stages ?? []).includes(founder.stage as string)
    })

    if (matchingFounders.length === 0) continue

    await sendMonthlyLenderDigest({
      lenderEmail,
      matchingFounders: matchingFounders.map((f) => ({
        company_name: f.company_name,
        stage: f.stage as string,
        product_categories: (f.product_categories ?? []) as string[],
      })),
      platformStats,
    })
    emailsSent++
  }

  return NextResponse.json({ ok: true, emailsSent })
}
