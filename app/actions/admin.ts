'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { sendWelcomeFounderEmail, sendWelcomeInvestorEmail, sendWelcomeLenderEmail, sendMonthlyFounderDigest, sendMonthlyInvestorDigest, sendMonthlyLenderDigest, buildMonthlyFounderDigestEmail, buildMonthlyInvestorDigestEmail, buildMonthlyLenderDigestEmail } from '@/lib/email'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')
}

export async function approveFounder(founderId: string) {
  await requireAdmin()

  const admin = createAdminClient()
  const { error } = await admin
    .from('founder_profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ is_approved: true, status: 'active', approved_at: new Date().toISOString() } as any)
    .eq('id', founderId)

  if (error) throw new Error(error.message)

  try {
    const { data: profile } = await admin.from('profiles').select('email').eq('id', founderId).single()
    if (profile?.email) await sendWelcomeFounderEmail({ email: profile.email })
  } catch {
    // Email errors are non-fatal
  }

  revalidatePath('/admin')
}

export async function approveInvestor(investorId: string) {
  await requireAdmin()

  const admin = createAdminClient()
  const { error } = await admin
    .from('investor_profiles')
    .update({ is_approved: true })
    .eq('id', investorId)

  if (error) throw new Error(error.message)

  // Best-effort status update (requires migration 00023)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('investor_profiles') as any).update({ status: 'active' }).eq('id', investorId)
  } catch {}

  try {
    const { data: profile } = await admin.from('profiles').select('email').eq('id', investorId).single()
    if (profile?.email) await sendWelcomeInvestorEmail({ email: profile.email })
  } catch {
    // Email errors are non-fatal
  }

  revalidatePath('/admin')
}

export async function rejectInvestor(investorId: string) {
  await requireAdmin()

  const admin = createAdminClient()
  await admin.from('flags').delete().eq('investor_id', investorId)

  const { error } = await admin
    .from('investor_profiles')
    .delete()
    .eq('id', investorId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/discover')
}

export async function deleteInvestorProfile(investorId: string) {
  await requireAdmin()

  const admin = createAdminClient()
  await admin.from('flags').delete().eq('investor_id', investorId)

  const { error } = await admin
    .from('investor_profiles')
    .delete()
    .eq('id', investorId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/discover')
}

export async function rejectFounder(founderId: string) {
  await requireAdmin()

  const admin = createAdminClient()

  await admin.from('flags').delete().eq('founder_id', founderId)
  await admin.from('lender_flags').delete().eq('founder_id', founderId)

  const { error } = await admin
    .from('founder_profiles')
    .update({ status: 'closed' })
    .eq('id', founderId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/discover')
  revalidatePath('/dashboard')
}

export async function approveLender(lenderId: string) {
  await requireAdmin()

  const admin = createAdminClient()
  const { error } = await admin
    .from('lender_profiles')
    .update({ is_approved: true })
    .eq('id', lenderId)

  if (error) throw new Error(error.message)

  // Best-effort status update (requires migration 00023)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('lender_profiles') as any).update({ status: 'active' }).eq('id', lenderId)
  } catch {}

  try {
    const { data: profile } = await admin.from('profiles').select('email').eq('id', lenderId).single()
    if (profile?.email) await sendWelcomeLenderEmail({ email: profile.email })
  } catch {
    // Email errors are non-fatal
  }

  revalidatePath('/admin')
}

export async function rejectLender(lenderId: string) {
  await requireAdmin()

  const admin = createAdminClient()
  await admin.from('lender_flags').delete().eq('lender_id', lenderId)

  const { error } = await admin
    .from('lender_profiles')
    .delete()
    .eq('id', lenderId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/discover')
}

export async function deleteLenderProfile(lenderId: string) {
  await requireAdmin()

  const admin = createAdminClient()

  await admin.from('lender_flags').delete().eq('lender_id', lenderId)

  const { error } = await admin
    .from('lender_profiles')
    .delete()
    .eq('id', lenderId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/discover')
}

export async function changeUserEmail(
  currentEmail: string,
  newEmail: string
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin()

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', currentEmail.trim().toLowerCase())
    .single()

  if (!profile) return { error: 'No user found with that email' }

  const { error: authError } = await admin.auth.admin.updateUserById(profile.id, {
    email: newEmail.trim().toLowerCase(),
  })
  if (authError) return { error: authError.message }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ email: newEmail.trim().toLowerCase() })
    .eq('id', profile.id)

  if (profileError) return { error: profileError.message }

  return { success: true }
}

export async function setUserPassword(
  email: string,
  newPassword: string
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin()

  if (newPassword.length < 8) return { error: 'Password must be at least 8 characters' }

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (!profile) return { error: 'No user found with that email' }

  const { error: authError } = await admin.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  })
  if (authError) return { error: authError.message }

  return { success: true }
}

export async function deleteFounderProfile(founderId: string) {
  await requireAdmin()

  const admin = createAdminClient()

  // Delete related flags first to avoid FK constraint errors
  await admin.from('flags').delete().eq('founder_id', founderId)
  await admin.from('lender_flags').delete().eq('founder_id', founderId)

  const { error } = await admin
    .from('founder_profiles')
    .delete()
    .eq('id', founderId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/discover')
}

export async function triggerDigest(): Promise<{ emailsSent?: number; total?: number; skipped?: number; error?: string }> {
  await requireAdmin()

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
    admin.from('founder_profiles').select('id, stage, product_categories, company_name').eq('is_approved', true).eq('status', 'active'),
    admin.from('investor_profiles').select('id, firm_name, partner_name, stages, saas_subcategories').eq('is_approved', true),
    admin.from('lender_profiles').select('id, institution_name, contact_name, stages').eq('is_approved', true),
    admin.from('flags').select('founder_id, investor_id').in('status', ['pending', 'accepted']),
    admin.from('lender_flags').select('founder_id, lender_id').in('status', ['pending', 'accepted']),
    admin.from('investor_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('lender_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('investor_profiles').select('firm_name, partner_name').eq('is_approved', true).order('created_at', { ascending: false }).limit(5),
    admin.from('lender_profiles').select('institution_name, contact_name').eq('is_approved', true).order('created_at', { ascending: false }).limit(5),
    admin.from('flags').select('founder_id, investor_id, responded_at').eq('status', 'accepted').order('responded_at', { ascending: false }).limit(10),
    admin.from('lender_flags').select('founder_id, lender_id, responded_at').eq('status', 'accepted').order('responded_at', { ascending: false }).limit(10),
  ])

  const allProfileIds = [
    ...(founders ?? []).map((f) => f.id),
    ...(investors ?? []).map((i) => i.id),
    ...(lenders ?? []).map((l) => l.id),
  ]
  const { data: profileRows } = await admin.from('profiles').select('id, email').in('id', allProfileIds)
  const emailMap = Object.fromEntries((profileRows ?? []).map((p) => [p.id, p.email as string]))

  const investorPairs = new Set((investorFlags ?? []).map((f) => `${f.founder_id}:${f.investor_id}`))
  const lenderPairs = new Set((lenderFlags ?? []).map((f) => `${f.founder_id}:${f.lender_id}`))
  const investorNameMap = Object.fromEntries((investors ?? []).map((i) => [i.id, i.firm_name]))
  const lenderNameMap = Object.fromEntries((lenders ?? []).map((l) => [l.id, l.institution_name]))
  const founderNameMap = Object.fromEntries((founders ?? []).map((f) => [f.id, f.company_name]))

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

  let skipped = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const founderPayloads = (founders ?? []).flatMap((founder: any) => {
    const founderEmail = emailMap[founder.id]
    if (!founderEmail) { skipped++; return [] }
    const hasCategories = (founder.product_categories ?? []).length > 0
    const matchingInvestors = !hasCategories ? [] : (investors ?? []).filter((inv) => {
      if (investorPairs.has(`${founder.id}:${inv.id}`)) return false
      if (!(inv.stages as string[] ?? []).length) return false
      return (inv.stages as string[] ?? []).includes(founder.stage) && (inv.saas_subcategories ?? []).some((s: string) => (founder.product_categories ?? []).includes(s))
    })
    const matchingLenders = !hasCategories ? [] : (lenders ?? []).filter((lender) => {
      if (lenderPairs.has(`${founder.id}:${lender.id}`)) return false
      if (!(lender.stages ?? []).length) return false
      return (lender.stages ?? []).includes(founder.stage)
    })
    return [buildMonthlyFounderDigestEmail({
      founderEmail,
      matchingInvestors: matchingInvestors.map((inv) => ({ firm_name: inv.firm_name, partner_name: inv.partner_name })),
      matchingLenders: matchingLenders.map((l) => ({ institution_name: l.institution_name, contact_name: l.contact_name })),
      platformStats,
    })]
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const investorPayloads = (investors ?? []).flatMap((investor: any) => {
    const investorEmail = emailMap[investor.id]
    if (!investorEmail) { skipped++; return [] }
    const hasStages = (investor.stages ?? []).length > 0
    const hasCats = (investor.saas_subcategories ?? []).length > 0
    const matchingFounders = (!hasStages || !hasCats) ? [] : (founders ?? []).filter((founder) => {
      if (investorPairs.has(`${founder.id}:${investor.id}`)) return false
      if (!(founder.product_categories ?? []).length) return false
      return (investor.stages ?? []).includes(founder.stage) && (investor.saas_subcategories ?? []).some((s: string) => (founder.product_categories ?? []).includes(s))
    })
    return [buildMonthlyInvestorDigestEmail({
      investorEmail,
      matchingFounders: matchingFounders.map((f) => ({ company_name: f.company_name, stage: f.stage as string, product_categories: (f.product_categories ?? []) as string[] })),
      platformStats,
    })]
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lenderPayloads = (lenders ?? []).flatMap((lender: any) => {
    const lenderEmail = emailMap[lender.id]
    if (!lenderEmail) { skipped++; return [] }
    const hasStages = (lender.stages ?? []).length > 0
    const matchingFounders = !hasStages ? [] : (founders ?? []).filter((founder) => {
      if (lenderPairs.has(`${founder.id}:${lender.id}`)) return false
      if (!(founder.product_categories ?? []).length) return false
      return (lender.stages ?? []).includes(founder.stage)
    })
    return [buildMonthlyLenderDigestEmail({
      lenderEmail,
      matchingFounders: matchingFounders.map((f) => ({ company_name: f.company_name, stage: f.stage as string, product_categories: (f.product_categories ?? []) as string[] })),
      platformStats,
    })]
  })

  const allPayloads = [...founderPayloads, ...investorPayloads, ...lenderPayloads]
  const total = allPayloads.length

  // Resend batch API: up to 100 emails per call — far fewer HTTP round-trips
  // than individual sends, keeping total runtime well within Vercel's limits.
  const resend = new Resend(process.env.RESEND_API_KEY!)
  let emailsSent = 0
  for (let i = 0; i < allPayloads.length; i += 100) {
    const batch = allPayloads.slice(i, i + 100)
    const { data, error } = await resend.batch.send(batch)
    if (!error) emailsSent += data?.data?.length ?? batch.length
  }

  return { emailsSent, total, skipped }
}

export async function sendTestDigestToEmail(email: string): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin()
  if (!email) return { error: 'Email is required' }

  const admin = createAdminClient()

  const [
    { data: founders },
    { data: investors },
    { data: lenders },
    { count: investorCount },
    { count: lenderCount },
    { data: latestInvestors },
    { data: latestLenders },
    { data: acceptedInvConn },
    { data: acceptedLenConn },
    { data: allFoundersForMap },
    { data: allInvestorsForMap },
    { data: allLendersForMap },
  ] = await Promise.all([
    admin.from('founder_profiles').select('id, stage, product_categories, company_name').eq('is_approved', true).eq('status', 'active').limit(5),
    admin.from('investor_profiles').select('id, firm_name, partner_name, stages, saas_subcategories').eq('is_approved', true).limit(5),
    admin.from('lender_profiles').select('id, institution_name, contact_name, stages').eq('is_approved', true).limit(3),
    admin.from('investor_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('lender_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('investor_profiles').select('firm_name, partner_name').eq('is_approved', true).order('created_at', { ascending: false }).limit(5),
    admin.from('lender_profiles').select('institution_name, contact_name').eq('is_approved', true).order('created_at', { ascending: false }).limit(5),
    admin.from('flags').select('founder_id, investor_id, responded_at').eq('status', 'accepted').order('responded_at', { ascending: false }).limit(10),
    admin.from('lender_flags').select('founder_id, lender_id, responded_at').eq('status', 'accepted').order('responded_at', { ascending: false }).limit(10),
    admin.from('founder_profiles').select('id, company_name').eq('is_approved', true).eq('status', 'active'),
    admin.from('investor_profiles').select('id, firm_name').eq('is_approved', true),
    admin.from('lender_profiles').select('id, institution_name').eq('is_approved', true),
  ])

  // Name maps built from full data so connections show real names
  const investorNameMap = Object.fromEntries((allInvestorsForMap ?? []).map((i) => [i.id, i.firm_name]))
  const lenderNameMap = Object.fromEntries((allLendersForMap ?? []).map((l) => [l.id, l.institution_name]))
  const founderNameMap = Object.fromEntries((allFoundersForMap ?? []).map((f) => [f.id, f.company_name]))

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

  await sendMonthlyFounderDigest({
    founderEmail: email,
    matchingInvestors: (investors ?? []).slice(0, 3).map((i) => ({ firm_name: i.firm_name, partner_name: i.partner_name })),
    matchingLenders: (lenders ?? []).slice(0, 2).map((l) => ({ institution_name: l.institution_name, contact_name: l.contact_name })),
    platformStats,
  })

  await sendMonthlyInvestorDigest({
    investorEmail: email,
    matchingFounders: (founders ?? []).slice(0, 3).map((f) => ({ company_name: f.company_name, stage: f.stage as string, product_categories: (f.product_categories ?? []) as string[] })),
    platformStats,
  })

  await sendMonthlyLenderDigest({
    lenderEmail: email,
    matchingFounders: (founders ?? []).slice(0, 3).map((f) => ({ company_name: f.company_name, stage: f.stage as string, product_categories: (f.product_categories ?? []) as string[] })),
    platformStats,
  })

  return { success: true }
}
