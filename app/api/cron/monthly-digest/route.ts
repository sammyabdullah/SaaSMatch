import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMonthlyFounderDigest, sendMonthlyInvestorDigest } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Fetch all data in parallel
  const [
    { data: founders },
    { data: investors },
    { data: lenders },
    { data: investorFlags },
    { data: lenderFlags },
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
  ])

  // Build existing-connection lookup sets
  const investorPairs = new Set((investorFlags ?? []).map((f) => `${f.founder_id}:${f.investor_id}`))
  const lenderPairs = new Set((lenderFlags ?? []).map((f) => `${f.founder_id}:${f.lender_id}`))

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
      founderCompanyName: founder.company_name,
      matchingInvestors: matchingInvestors.map((inv) => ({
        firm_name: inv.firm_name,
        partner_name: inv.partner_name,
      })),
      matchingLenders: matchingLenders.map((l) => ({
        institution_name: l.institution_name,
        contact_name: l.contact_name,
      })),
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
      investorName: investor.partner_name,
      matchingFounders: matchingFounders.map((f) => ({
        company_name: f.company_name,
        stage: f.stage as string,
        product_categories: (f.product_categories ?? []) as string[],
      })),
    })
    emailsSent++
  }

  return NextResponse.json({ ok: true, emailsSent })
}
