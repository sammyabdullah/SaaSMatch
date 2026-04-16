import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'UnlockedVC <noreply@unlockedvc.com>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'sammy@blossomstreetventures.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://unlockedvc.com'

// ─── Founder flagged an investor ─────────────────────────────────────────────
// Email goes to the investor with the founder's profile summary.
export async function sendFounderFlaggedInvestorEmail({
  investorEmail,
  founder,
}: {
  investorEmail: string
  founder: {
    stage: string
    arr_range: string
    raising_amount_usd: number
    product_categories: string[]
    mom_growth_pct: number | null
    why_now: string
    location: string
  }
}) {
  const categoryList = founder.product_categories.join(', ')
  const raise = formatUsd(founder.raising_amount_usd)

  await resend.emails.send({
    from: FROM,
    to: investorEmail,
    subject: 'UnlockedVC request',
    html: `
      <p>A founder in the UnlockedVC network has flagged your profile and would like to connect.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stage</td><td style="font-size:13px">${fmtStage(founder.stage)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">ARR range</td><td style="font-size:13px">${fmtArr(founder.arr_range)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Raising</td><td style="font-size:13px">${raise}</td></tr>
        ${founder.mom_growth_pct != null ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">YOY growth</td><td style="font-size:13px">${founder.mom_growth_pct}%</td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Categories</td><td style="font-size:13px">${categoryList}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${founder.location}</td></tr>
      </table>

      ${founder.why_now ? `<p style="font-style:italic;color:#444">"${founder.why_now}"</p>` : ''}

      <p>Log in to your dashboard to accept or decline this introduction.</p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>

      <p style="color:#999;font-size:12px">You're receiving this because you have an approved investor profile on UnlockedVC.</p>
    `,
  })
}

// ─── Investor flagged a founder ───────────────────────────────────────────────
// Email goes to the founder telling them to check their dashboard.
export async function sendInvestorFlaggedFounderEmail({
  founderEmail,
  investor,
}: {
  founderEmail: string
  investor: {
    firm_name: string
    partner_name: string
    check_size_min_usd: number
    check_size_max_usd: number
    stages: string[]
    geography_focus: string
    thesis_statement: string
  }
}) {
  const checkRange = `${formatUsd(investor.check_size_min_usd)} – ${formatUsd(investor.check_size_max_usd)}`
  const stages = investor.stages.map(fmtStage).join(', ')

  await resend.emails.send({
    from: FROM,
    to: founderEmail,
    subject: 'UnlockedVC request',
    html: `
      <p><strong>${investor.firm_name}</strong> (${investor.partner_name}) has flagged your profile on UnlockedVC and would like to connect.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Firm</td><td style="font-size:13px">${investor.firm_name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Partner</td><td style="font-size:13px">${investor.partner_name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Check size</td><td style="font-size:13px">${checkRange}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stages</td><td style="font-size:13px">${stages}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Geography</td><td style="font-size:13px">${investor.geography_focus}</td></tr>
      </table>

      ${investor.thesis_statement ? `<p style="font-style:italic;color:#444">"${investor.thesis_statement}"</p>` : ''}

      <p>Log in to your dashboard to accept or decline this introduction.</p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>

      <p style="color:#999;font-size:12px">You're receiving this because you have an approved founder profile on UnlockedVC.</p>
    `,
  })
}

// ─── Connection accepted — notify the initiating founder ─────────────────────
export async function sendConnectionAcceptedFounderEmail({
  founderEmail,
  investorFirmName,
  investorPartnerName,
  investorWebsite,
  investorLocation,
  investorCheckSizeMin,
  investorCheckSizeMax,
  investorStages,
  investorGeography,
  investorThesis,
  investorEmail,
}: {
  founderEmail: string
  investorFirmName: string
  investorPartnerName: string
  investorWebsite?: string | null
  investorLocation?: string | null
  investorCheckSizeMin?: number | null
  investorCheckSizeMax?: number | null
  investorStages?: string[]
  investorGeography?: string | null
  investorThesis?: string | null
  investorEmail: string
}) {
  const firmLink = investorWebsite
    ? `<a href="${investorWebsite}" style="color:#534AB7;text-decoration:none">${investorFirmName}</a>`
    : `<strong>${investorFirmName}</strong>`

  const checkRange = investorCheckSizeMin && investorCheckSizeMax
    ? `${formatUsd(investorCheckSizeMin)} – ${formatUsd(investorCheckSizeMax)}`
    : null
  const stages = investorStages && investorStages.length > 0
    ? investorStages.map(fmtStage).join(', ')
    : null

  await resend.emails.send({
    from: FROM,
    to: founderEmail,
    subject: `${investorFirmName} accepted your connection request`,
    html: `
      <p>Great news! ${firmLink} (${investorPartnerName}) has accepted your introduction request on UnlockedVC.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        ${investorLocation ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${investorLocation}</td></tr>` : ''}
        ${checkRange ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Check size</td><td style="font-size:13px">${checkRange}</td></tr>` : ''}
        ${stages ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stages</td><td style="font-size:13px">${stages}</td></tr>` : ''}
        ${investorGeography ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Geography</td><td style="font-size:13px">${investorGeography}</td></tr>` : ''}
      </table>

      ${investorThesis ? `<p style="font-style:italic;color:#444;font-size:13px">"${investorThesis}"</p>` : ''}

      <p>You can now reach them directly:</p>
      <p style="font-size:16px"><strong>${investorEmail}</strong></p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>
    `,
  })
}

// ─── Connection accepted — notify the initiating investor ────────────────────
export async function sendConnectionAcceptedInvestorEmail({
  investorEmail,
  investorName,
  founderEmail,
  founderCompanyName,
  founderWebsite,
  founderLocation,
  founderStage,
  founderArrRange,
  founderCategories,
  founderMomGrowthPct,
  founderRaisingAmount,
  founderWhyNow,
}: {
  investorEmail: string
  investorName: string
  founderEmail: string
  founderCompanyName?: string | null
  founderWebsite?: string | null
  founderLocation?: string | null
  founderStage: string
  founderArrRange?: string | null
  founderCategories: string[]
  founderMomGrowthPct?: number | null
  founderRaisingAmount?: number | null
  founderWhyNow?: string | null
}) {
  const companyLink = founderWebsite
    ? `<a href="${founderWebsite}" style="color:#534AB7;text-decoration:none">${founderCompanyName ?? 'the company'}</a>`
    : founderCompanyName
      ? `<strong>${founderCompanyName}</strong>`
      : 'A founder'

  await resend.emails.send({
    from: FROM,
    to: investorEmail,
    subject: 'A founder accepted your connection request',
    html: `
      <p>Hi ${investorName},</p>

      <p>${companyLink} has accepted your introduction request on UnlockedVC.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        ${founderLocation ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${founderLocation}</td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stage</td><td style="font-size:13px">${fmtStage(founderStage)}</td></tr>
        ${founderArrRange ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">ARR range</td><td style="font-size:13px">${fmtArr(founderArrRange)}</td></tr>` : ''}
        ${founderMomGrowthPct != null ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">YOY growth</td><td style="font-size:13px">${founderMomGrowthPct}%</td></tr>` : ''}
        ${founderRaisingAmount ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Raising</td><td style="font-size:13px">${formatUsd(founderRaisingAmount)}</td></tr>` : ''}
        ${founderCategories.length > 0 ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Categories</td><td style="font-size:13px">${founderCategories.join(', ')}</td></tr>` : ''}
      </table>

      ${founderWhyNow ? `<p style="font-style:italic;color:#444;font-size:13px">"${founderWhyNow}"</p>` : ''}

      <p>You can now reach them directly:</p>
      <p style="font-size:16px"><strong>${founderEmail}</strong></p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>
    `,
  })
}

// ─── Admin notification ───────────────────────────────────────────────────────
export async function sendAdminConnectionEmail({
  founderEmail,
  investorFirmName,
  investorEmail,
  initiatedBy,
}: {
  founderEmail: string
  investorFirmName: string
  investorEmail: string
  initiatedBy: 'founder' | 'investor'
}) {
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New connection: ${founderEmail} ↔ ${investorFirmName}`,
    html: `
      <p>A new connection was made on UnlockedVC.</p>
      <p><strong>Founder:</strong> ${founderEmail}<br>
      <strong>Investor:</strong> ${investorFirmName} (${investorEmail})<br>
      <strong>Initiated by:</strong> ${initiatedBy}</p>
    `,
  })
}

// ─── Admin: new founder signup ────────────────────────────────────────────────
export async function sendAdminNewFounderEmail({
  email,
  company_name,
  location,
  stage,
  arr_range,
  raising_amount_usd,
}: {
  email: string
  company_name: string
  location: string
  stage: string
  arr_range: string
  raising_amount_usd: number
}) {
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New founder signup: ${company_name}`,
    html: `
      <p>A new founder has submitted a profile on UnlockedVC and is awaiting approval.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Email</td><td style="font-size:13px">${email}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Company</td><td style="font-size:13px">${company_name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${location}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stage</td><td style="font-size:13px">${fmtStage(stage)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">ARR range</td><td style="font-size:13px">${fmtArr(arr_range)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Raising</td><td style="font-size:13px">${formatUsd(raising_amount_usd)}</td></tr>
      </table>
      <p><a href="${APP_URL}/admin" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Review in Admin</a></p>
    `,
  })
}

// ─── Admin: new investor signup ───────────────────────────────────────────────
export async function sendAdminNewInvestorEmail({
  email,
  firm_name,
  partner_name,
  location,
  check_size_min_usd,
  check_size_max_usd,
}: {
  email: string
  firm_name: string
  partner_name: string
  location: string
  check_size_min_usd: number
  check_size_max_usd: number
}) {
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New investor signup: ${firm_name}`,
    html: `
      <p>A new investor has submitted a profile on UnlockedVC and is awaiting approval.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Email</td><td style="font-size:13px">${email}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Firm</td><td style="font-size:13px">${firm_name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Partner</td><td style="font-size:13px">${partner_name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${location}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Check size</td><td style="font-size:13px">${formatUsd(check_size_min_usd)} – ${formatUsd(check_size_max_usd)}</td></tr>
      </table>
      <p><a href="${APP_URL}/admin" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Review in Admin</a></p>
    `,
  })
}

// ─── Welcome: founder approved ───────────────────────────────────────────────
export async function sendWelcomeFounderEmail({ email }: { email: string }) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'You\'re approved — welcome to UnlockedVC',
    html: `
      <p>Your founder profile has been reviewed and approved. You're now live on UnlockedVC.</p>

      <p>You can now browse for Investors, and they can also discover your profile. You'll be notified here when one reciprocates or expresses interest in you.</p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Go to your dashboard</a></p>
    `,
  })
}

// ─── Welcome: investor approved ──────────────────────────────────────────────
export async function sendWelcomeInvestorEmail({ email }: { email: string }) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'You\'re approved — welcome to UnlockedVC',
    html: `
      <p>Your investor profile is approved. You now have full access to UnlockedVC.</p>

      <p>Browse active founder profiles in Discover and flag any that fit your thesis. You'll be notified here when a founder reciprocates interest in connecting with you or expresses the initial interest.</p>

      <p><a href="${APP_URL}/discover" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Browse founders</a></p>
    `,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fmtStage(s: string): string {
  const map: Record<string, string> = {
    'pre-seed': 'Pre-Seed',
    seed: 'Seed',
    'series-a': 'Series A',
    'series-b': 'Series B',
  }
  return map[s] ?? s
}

function fmtArr(r: string): string {
  const map: Record<string, string> = {
    '0-500k': '$0 – $500K',
    '500k-2m': '$500K – $2M',
    '2m-5m': '$2M – $5M',
    '5m-plus': '$5M+',
  }
  return map[r] ?? r
}
