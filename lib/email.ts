import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function esc(s: string | null | undefined): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function safeHref(url: string | null | undefined): string | null {
  if (!url) return null
  const lower = url.trim().toLowerCase()
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) return null
  return url.trim()
}

const FROM = 'FounderInvited <noreply@founderinvited.com>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'sammy@blossomstreetventures.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://founderinvited.com'
const EMAIL_FOOTER = '<p style="color:#999;font-size:12px;margin-top:24px">Please share FounderInvited with others. Courtesy of Blossom Street Ventures.</p>'

// ─── Founder flagged an investor ─────────────────────────────────────────────
// Email goes to the investor with the founder's profile summary.
export async function sendFounderFlaggedInvestorEmail({
  investorEmail,
  founder,
}: {
  investorEmail: string
  founder: {
    company_name: string
    website: string | null
    stage: string
    arr_range: string
    raising_amount_usd: number
    product_categories: string[]
    mom_growth_pct: number | null
    why_now: string
    location: string
  }
}) {
  const categoryList = founder.product_categories.map(esc).join(', ')
  const raise = formatUsd(founder.raising_amount_usd)
  const websiteHref = safeHref(founder.website)
  const companyLink = websiteHref
    ? `<a href="${websiteHref}" style="color:#534AB7;text-decoration:none">${esc(founder.company_name)}</a>`
    : `<strong>${esc(founder.company_name)}</strong>`

  await getResend().emails.send({
    from: FROM,
    to: investorEmail,
    subject: 'FounderInvited request',
    html: `
      <p>${companyLink} has flagged your profile on FounderInvited and would like to connect.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Company</td><td style="font-size:13px">${esc(founder.company_name)}</td></tr>
        ${websiteHref ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Website</td><td style="font-size:13px"><a href="${websiteHref}" style="color:#534AB7">${esc(founder.website)}</a></td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stage</td><td style="font-size:13px">${fmtStage(founder.stage)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">ARR range</td><td style="font-size:13px">${fmtArr(founder.arr_range)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Raising</td><td style="font-size:13px">${raise}</td></tr>
        ${founder.mom_growth_pct != null ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">YOY growth</td><td style="font-size:13px">${founder.mom_growth_pct}%</td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Categories</td><td style="font-size:13px">${categoryList}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${esc(founder.location)}</td></tr>
      </table>

      ${founder.why_now ? `<p style="font-style:italic;color:#444">"${esc(founder.why_now)}"</p>` : ''}

      <p>Log in to your dashboard to accept or decline this introduction.</p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>

      ${EMAIL_FOOTER}
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

  await getResend().emails.send({
    from: FROM,
    to: founderEmail,
    subject: 'FounderInvited request',
    html: `
      <p><strong>${esc(investor.firm_name)}</strong> (${esc(investor.partner_name)}) has flagged your profile on FounderInvited and would like to connect.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Firm</td><td style="font-size:13px">${esc(investor.firm_name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Partner</td><td style="font-size:13px">${esc(investor.partner_name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Check size</td><td style="font-size:13px">${checkRange}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stages</td><td style="font-size:13px">${stages}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Geography</td><td style="font-size:13px">${esc(investor.geography_focus)}</td></tr>
      </table>

      ${investor.thesis_statement ? `<p style="font-style:italic;color:#444">"${esc(investor.thesis_statement)}"</p>` : ''}

      <p>Log in to your dashboard to accept or decline this introduction.</p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>

      ${EMAIL_FOOTER}
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
  const firmHref = safeHref(investorWebsite)
  const firmLink = firmHref
    ? `<a href="${firmHref}" style="color:#534AB7;text-decoration:none">${esc(investorFirmName)}</a>`
    : `<strong>${esc(investorFirmName)}</strong>`

  const checkRange = investorCheckSizeMin && investorCheckSizeMax
    ? `${formatUsd(investorCheckSizeMin)} – ${formatUsd(investorCheckSizeMax)}`
    : null
  const stages = investorStages && investorStages.length > 0
    ? investorStages.map(fmtStage).join(', ')
    : null

  await getResend().emails.send({
    from: FROM,
    to: founderEmail,
    subject: 'Connection request confirmed',
    html: `
      <p>You're now connected with ${firmLink} (${esc(investorPartnerName)}) on FounderInvited.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        ${investorLocation ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${esc(investorLocation)}</td></tr>` : ''}
        ${checkRange ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Check size</td><td style="font-size:13px">${checkRange}</td></tr>` : ''}
        ${stages ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stages</td><td style="font-size:13px">${stages}</td></tr>` : ''}
        ${investorGeography ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Geography</td><td style="font-size:13px">${esc(investorGeography)}</td></tr>` : ''}
      </table>

      ${investorThesis ? `<p style="font-style:italic;color:#444;font-size:13px">"${esc(investorThesis)}"</p>` : ''}

      <p>You can now reach them directly:</p>
      <p style="font-size:16px"><strong>${investorEmail}</strong></p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>

      ${EMAIL_FOOTER}
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
  const founderHref2 = safeHref(founderWebsite)
  const companyLink = founderHref2
    ? `<a href="${founderHref2}" style="color:#534AB7;text-decoration:none">${esc(founderCompanyName ?? 'the company')}</a>`
    : founderCompanyName
      ? `<strong>${esc(founderCompanyName)}</strong>`
      : 'A founder'

  await getResend().emails.send({
    from: FROM,
    to: investorEmail,
    subject: 'Connection request confirmed',
    html: `
      <p>You're now connected with ${companyLink} on FounderInvited.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        ${founderLocation ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${esc(founderLocation)}</td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stage</td><td style="font-size:13px">${fmtStage(founderStage)}</td></tr>
        ${founderArrRange ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">ARR range</td><td style="font-size:13px">${fmtArr(founderArrRange)}</td></tr>` : ''}
        ${founderMomGrowthPct != null ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">YOY growth</td><td style="font-size:13px">${founderMomGrowthPct}%</td></tr>` : ''}
        ${founderRaisingAmount ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Raising</td><td style="font-size:13px">${formatUsd(founderRaisingAmount)}</td></tr>` : ''}
        ${founderCategories.length > 0 ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Categories</td><td style="font-size:13px">${founderCategories.map(esc).join(', ')}</td></tr>` : ''}
      </table>

      ${founderWhyNow ? `<p style="font-style:italic;color:#444;font-size:13px">"${esc(founderWhyNow)}"</p>` : ''}

      <p>You can now reach them directly:</p>
      <p style="font-size:16px"><strong>${founderEmail}</strong></p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>

      ${EMAIL_FOOTER}
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
  await getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New connection: ${founderEmail} ↔ ${investorFirmName}`,
    html: `
      <p>A new connection was made on FounderInvited.</p>
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
  await getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New founder signup: ${company_name}`,
    html: `
      <p>A new founder has submitted a profile on FounderInvited and is awaiting approval.</p>
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
  await getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New investor signup: ${firm_name}`,
    html: `
      <p>A new investor has submitted a profile on FounderInvited and is awaiting approval.</p>
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
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'You\'re approved — welcome to FounderInvited',
    html: `
      <p>Your founder profile has been reviewed and approved. You're now live on FounderInvited.</p>

      <p>You can now browse for Investors, and they can also discover your profile. You'll be notified here when one reciprocates or expresses interest in you.</p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Go to your dashboard</a></p>

      ${EMAIL_FOOTER}
    `,
  })
}

// ─── Welcome: investor approved ──────────────────────────────────────────────
export async function sendWelcomeInvestorEmail({ email }: { email: string }) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'You\'re approved — welcome to FounderInvited',
    html: `
      <p>Your investor profile is approved. You now have full access to FounderInvited.</p>

      <p>Browse active founder profiles in Discover and flag any that fit your thesis. You'll be notified here when a founder reciprocates interest in connecting with you or expresses the initial interest.</p>

      <p><a href="${APP_URL}/discover" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Browse founders</a></p>

      ${EMAIL_FOOTER}
    `,
  })
}

// ─── Admin: new lender signup ─────────────────────────────────────────────────
export async function sendAdminNewLenderEmail({
  email,
  institution_name,
  contact_name,
  location,
  loan_size_min_usd,
  loan_size_max_usd,
}: {
  email: string
  institution_name: string
  contact_name: string
  location: string
  loan_size_min_usd: number
  loan_size_max_usd: number
}) {
  await getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New lender signup: ${institution_name}`,
    html: `
      <p>A new lender has submitted a profile on FounderInvited and is awaiting approval.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Email</td><td style="font-size:13px">${email}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Institution</td><td style="font-size:13px">${institution_name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Contact</td><td style="font-size:13px">${contact_name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${location}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Loan size</td><td style="font-size:13px">${formatUsd(loan_size_min_usd)} – ${formatUsd(loan_size_max_usd)}</td></tr>
      </table>
      <p><a href="${APP_URL}/admin" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Review in Admin</a></p>
    `,
  })
}

// ─── Welcome: lender approved ─────────────────────────────────────────────────
export async function sendWelcomeLenderEmail({ email }: { email: string }) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'You\'re approved — welcome to FounderInvited',
    html: `
      <p>Your lender profile is approved. You now have full access to FounderInvited.</p>

      <p>Browse active founder profiles in Discover and express interest in companies that fit your lending criteria.</p>

      <p><a href="${APP_URL}/discover" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Browse founders</a></p>

      ${EMAIL_FOOTER}
    `,
  })
}

// ─── Founder flagged a lender ─────────────────────────────────────────────────
// Email goes to the lender with the founder's profile summary.
export async function sendFounderFlaggedLenderEmail({
  lenderEmail,
  founder,
}: {
  lenderEmail: string
  founder: {
    company_name: string
    website: string | null
    stage: string
    arr_range: string
    raising_amount_usd: number
    product_categories: string[]
    mom_growth_pct: number | null
    why_now: string
    location: string
  }
}) {
  const categoryList = founder.product_categories.map(esc).join(', ')
  const raise = formatUsd(founder.raising_amount_usd)
  const lenderWebsiteHref = safeHref(founder.website)
  const companyLink = lenderWebsiteHref
    ? `<a href="${lenderWebsiteHref}" style="color:#534AB7;text-decoration:none">${esc(founder.company_name)}</a>`
    : `<strong>${esc(founder.company_name)}</strong>`

  await getResend().emails.send({
    from: FROM,
    to: lenderEmail,
    subject: 'FounderInvited request',
    html: `
      <p>${companyLink} has expressed interest in connecting with you on FounderInvited.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Company</td><td style="font-size:13px">${esc(founder.company_name)}</td></tr>
        ${lenderWebsiteHref ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Website</td><td style="font-size:13px"><a href="${lenderWebsiteHref}" style="color:#534AB7">${esc(founder.website)}</a></td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stage</td><td style="font-size:13px">${fmtStage(founder.stage)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">ARR range</td><td style="font-size:13px">${fmtArr(founder.arr_range)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Raising</td><td style="font-size:13px">${raise}</td></tr>
        ${founder.mom_growth_pct != null ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">YOY growth</td><td style="font-size:13px">${founder.mom_growth_pct}%</td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Categories</td><td style="font-size:13px">${categoryList}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${esc(founder.location)}</td></tr>
      </table>

      ${founder.why_now ? `<p style="font-style:italic;color:#444">"${esc(founder.why_now)}"</p>` : ''}

      <p>Log in to your dashboard to accept or decline this introduction.</p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>

      ${EMAIL_FOOTER}
    `,
  })
}

// ─── Lender flagged a founder ─────────────────────────────────────────────────
export async function sendLenderFlaggedFounderEmail({
  founderEmail,
  lender,
}: {
  founderEmail: string
  lender: {
    institution_name: string
    contact_name: string
    loan_size_min_usd: number
    loan_size_max_usd: number
    stages: string[]
    geography_focus: string
    thesis_statement: string
  }
}) {
  const loanRange = `${formatUsd(lender.loan_size_min_usd)} – ${formatUsd(lender.loan_size_max_usd)}`
  const stages = lender.stages.map(fmtStage).join(', ')

  await getResend().emails.send({
    from: FROM,
    to: founderEmail,
    subject: 'FounderInvited request',
    html: `
      <p><strong>${esc(lender.institution_name)}</strong> (${esc(lender.contact_name)}) has expressed interest in your company on FounderInvited.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Institution</td><td style="font-size:13px">${esc(lender.institution_name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Contact</td><td style="font-size:13px">${esc(lender.contact_name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Loan size</td><td style="font-size:13px">${loanRange}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stages</td><td style="font-size:13px">${stages}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Geography</td><td style="font-size:13px">${esc(lender.geography_focus)}</td></tr>
      </table>

      ${lender.thesis_statement ? `<p style="font-style:italic;color:#444">"${esc(lender.thesis_statement)}"</p>` : ''}

      <p>Log in to your dashboard to accept or decline this introduction.</p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>

      ${EMAIL_FOOTER}
    `,
  })
}

// ─── Connection accepted — notify lender (founder accepted lender's flag) ─────
export async function sendConnectionAcceptedLenderEmail({
  lenderEmail,
  lenderName,
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
  lenderEmail: string
  lenderName: string
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
  const lenderConnHref = safeHref(founderWebsite)
  const companyLink = lenderConnHref
    ? `<a href="${lenderConnHref}" style="color:#534AB7;text-decoration:none">${esc(founderCompanyName ?? 'the company')}</a>`
    : founderCompanyName
      ? `<strong>${esc(founderCompanyName)}</strong>`
      : 'A founder'

  await getResend().emails.send({
    from: FROM,
    to: lenderEmail,
    subject: 'You accepted a connection request on FounderInvited',
    html: `
      <p>Hi ${lenderName},</p>

      <p>${companyLink} has accepted your introduction request on FounderInvited.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        ${founderLocation ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${esc(founderLocation)}</td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stage</td><td style="font-size:13px">${fmtStage(founderStage)}</td></tr>
        ${founderArrRange ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">ARR range</td><td style="font-size:13px">${fmtArr(founderArrRange)}</td></tr>` : ''}
        ${founderMomGrowthPct != null ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">YOY growth</td><td style="font-size:13px">${founderMomGrowthPct}%</td></tr>` : ''}
        ${founderRaisingAmount ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Raising</td><td style="font-size:13px">${formatUsd(founderRaisingAmount)}</td></tr>` : ''}
        ${founderCategories.length > 0 ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Categories</td><td style="font-size:13px">${founderCategories.map(esc).join(', ')}</td></tr>` : ''}
      </table>

      ${founderWhyNow ? `<p style="font-style:italic;color:#444;font-size:13px">"${esc(founderWhyNow)}"</p>` : ''}

      <p>You can now reach them directly:</p>
      <p style="font-size:16px"><strong>${founderEmail}</strong></p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>

      ${EMAIL_FOOTER}
    `,
  })
}

// ─── Connection accepted — notify founder (lender accepted founder's flag) ────
export async function sendConnectionAcceptedFounderFromLenderEmail({
  founderEmail,
  lenderInstitutionName,
  lenderContactName,
  lenderWebsite,
  lenderLocation,
  lenderLoanSizeMin,
  lenderLoanSizeMax,
  lenderStages,
  lenderGeography,
  lenderThesis,
  lenderEmail,
}: {
  founderEmail: string
  lenderInstitutionName: string
  lenderContactName: string
  lenderWebsite?: string | null
  lenderLocation?: string | null
  lenderLoanSizeMin?: number | null
  lenderLoanSizeMax?: number | null
  lenderStages?: string[]
  lenderGeography?: string | null
  lenderThesis?: string | null
  lenderEmail: string
}) {
  const institutionLink = lenderWebsite
    ? `<a href="${lenderWebsite}" style="color:#534AB7;text-decoration:none">${lenderInstitutionName}</a>`
    : `<strong>${lenderInstitutionName}</strong>`

  const loanRange = lenderLoanSizeMin && lenderLoanSizeMax
    ? `${formatUsd(lenderLoanSizeMin)} – ${formatUsd(lenderLoanSizeMax)}`
    : null
  const stages = lenderStages && lenderStages.length > 0
    ? lenderStages.map(fmtStage).join(', ')
    : null

  await getResend().emails.send({
    from: FROM,
    to: founderEmail,
    subject: `${lenderInstitutionName} accepted your connection request`,
    html: `
      <p>Great news! ${institutionLink} (${lenderContactName}) has accepted your introduction request on FounderInvited.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        ${lenderLocation ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${lenderLocation}</td></tr>` : ''}
        ${loanRange ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Loan size</td><td style="font-size:13px">${loanRange}</td></tr>` : ''}
        ${stages ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stages</td><td style="font-size:13px">${stages}</td></tr>` : ''}
        ${lenderGeography ? `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Geography</td><td style="font-size:13px">${lenderGeography}</td></tr>` : ''}
      </table>

      ${lenderThesis ? `<p style="font-style:italic;color:#444;font-size:13px">"${lenderThesis}"</p>` : ''}

      <p>You can now reach them directly:</p>
      <p style="font-size:16px"><strong>${lenderEmail}</strong></p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>

      ${EMAIL_FOOTER}
    `,
  })
}

// ─── Admin notification for lender connection ─────────────────────────────────
export async function sendAdminLenderConnectionEmail({
  founderEmail,
  lenderInstitutionName,
  lenderEmail,
  initiatedBy,
}: {
  founderEmail: string
  lenderInstitutionName: string
  lenderEmail: string
  initiatedBy: 'founder' | 'lender'
}) {
  await getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New lender connection: ${founderEmail} ↔ ${lenderInstitutionName}`,
    html: `
      <p>A new lender connection was made on FounderInvited.</p>
      <p><strong>Founder:</strong> ${founderEmail}<br>
      <strong>Lender:</strong> ${lenderInstitutionName} (${lenderEmail})<br>
      <strong>Initiated by:</strong> ${initiatedBy}</p>
    `,
  })
}

// ─── Monthly digest: founder ──────────────────────────────────────────────────

function formatOpeningParagraph(text: string): string {
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  return paragraphs.map(p => `<p style="font-size:14px;color:#374151;margin:0 0 14px">${p.replace(/\n/g, '<br>')}</p>`).join('')
}

type FounderDigestParams = {
  founderEmail: string
  platformStats: PlatformStats
  openingParagraph?: string
  subjectLine?: string
}
export function buildMonthlyFounderDigestEmail({ founderEmail, platformStats, openingParagraph, subjectLine }: FounderDigestParams) {
  return {
    from: FROM,
    to: founderEmail,
    subject: subjectLine || 'FounderInvited update',
    html: `<div style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      ${openingParagraph ? formatOpeningParagraph(openingParagraph) : ''}
      <div style="max-width:600px">

      <p style="margin-top:28px"><a href="${APP_URL}/login" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Log In</a></p>

      ${buildPlatformStatsHtml(platformStats)}

      ${EMAIL_FOOTER}
      </div>
    </div>`,
  }
}
export async function sendMonthlyFounderDigest(params: FounderDigestParams) {
  const { error } = await getResend().emails.send(buildMonthlyFounderDigestEmail(params))
  if (error) throw new Error(error.message)
}

// ─── Monthly digest: investor ─────────────────────────────────────────────────
type InvestorDigestParams = {
  investorEmail: string
  platformStats: PlatformStats
  openingParagraph?: string
  subjectLine?: string
}
export function buildMonthlyInvestorDigestEmail({ investorEmail, platformStats, openingParagraph, subjectLine }: InvestorDigestParams) {
  return {
    from: FROM,
    to: investorEmail,
    subject: subjectLine || 'FounderInvited update',
    html: `<div style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      ${openingParagraph ? formatOpeningParagraph(openingParagraph) : ''}
      <div style="max-width:600px">

      <p style="margin-top:28px"><a href="${APP_URL}/login" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Log In</a></p>

      ${buildPlatformStatsHtml(platformStats)}

      ${EMAIL_FOOTER}
      </div>
    </div>`,
  }
}
export async function sendMonthlyInvestorDigest(params: InvestorDigestParams) {
  const { error } = await getResend().emails.send(buildMonthlyInvestorDigestEmail(params))
  if (error) throw new Error(error.message)
}

// ─── Monthly digest: lender ──────────────────────────────────────────────────
type LenderDigestParams = {
  lenderEmail: string
  platformStats: PlatformStats
  openingParagraph?: string
  subjectLine?: string
}
export function buildMonthlyLenderDigestEmail({ lenderEmail, platformStats, openingParagraph, subjectLine }: LenderDigestParams) {
  return {
    from: FROM,
    to: lenderEmail,
    subject: subjectLine || 'FounderInvited update',
    html: `<div style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      ${openingParagraph ? formatOpeningParagraph(openingParagraph) : ''}
      <div style="max-width:600px">

      <p style="margin-top:28px"><a href="${APP_URL}/login" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Log In</a></p>

      ${buildPlatformStatsHtml(platformStats)}

      ${EMAIL_FOOTER}
      </div>
    </div>`,
  }
}
export async function sendMonthlyLenderDigest(params: LenderDigestParams) {
  const { error } = await getResend().emails.send(buildMonthlyLenderDigestEmail(params))
  if (error) throw new Error(error.message)
}

// ─── Platform stats type & HTML builder ──────────────────────────────────────
type PlatformStats = {
  investorCount: number
  lenderCount: number
  latestInvestors: { firm_name: string; partner_name: string }[]
  latestLenders: { institution_name: string; contact_name: string }[]
  latestConnections: { left: string; right: string }[]
}

function buildPlatformStatsHtml(s: PlatformStats): string {
  // space-y-3 = 12px gap between items (matches homepage)
  const invItems = s.latestInvestors.map((inv, i) => `
    <div style="${i > 0 ? 'border-top:1px solid #f3f4f6;padding-top:12px;margin-top:12px' : ''}">
      <p style="font-size:14px;font-weight:600;color:#111827;margin:0;line-height:1.3">${inv.firm_name}</p>
      <p style="font-size:12px;color:#6b7280;margin:2px 0 0">${inv.partner_name}</p>
    </div>`).join('')

  const lenItems = s.latestLenders.map((l, i) => `
    <div style="${i > 0 ? 'border-top:1px solid #f3f4f6;padding-top:12px;margin-top:12px' : ''}">
      <p style="font-size:14px;font-weight:600;color:#111827;margin:0;line-height:1.3">${l.institution_name}</p>
      <p style="font-size:12px;color:#6b7280;margin:2px 0 0">${l.contact_name}</p>
    </div>`).join('')

  // space-y-1.5 = 6px gap between connection rows (matches homepage)
  const connRows = s.latestConnections.map((c, i) => `
    <div style="${i > 0 ? 'border-top:1px solid #f3f4f6;padding-top:6px;margin-top:6px' : ''}">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="46%" style="font-size:14px;font-weight:600;color:#111827">${c.left}</td>
          <td width="8%" style="font-size:12px;color:#9ca3af;text-align:center;white-space:nowrap">and</td>
          <td width="46%" style="font-size:14px;font-weight:600;color:#111827;text-align:right">${c.right}</td>
        </tr>
      </table>
    </div>`).join('')

  return `
    <div style="margin-top:12px;border-top:1px solid #e5e7eb;padding-top:12px">
      <p style="font-size:11px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 8px">Platform activity</p>

      <!-- Live counts — p-5 = 20px padding, matches homepage -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px">
        <tr>
          <td width="50%" style="padding-right:6px">
            <div style="border:1px solid #f3f4f6;border-radius:12px;padding:20px;text-align:center;background:#fff">
              <p style="font-size:11px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 4px">Live Investors on FounderInvited</p>
              <p style="font-size:30px;font-weight:700;color:#534AB7;margin:0">${s.investorCount}</p>
            </div>
          </td>
          <td width="50%" style="padding-left:6px">
            <div style="border:1px solid #f3f4f6;border-radius:12px;padding:20px;text-align:center;background:#fff">
              <p style="font-size:11px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 4px">Live Lenders on FounderInvited</p>
              <p style="font-size:30px;font-weight:700;color:#534AB7;margin:0">${s.lenderCount}</p>
            </div>
          </td>
        </tr>
      </table>

      <!-- Latest to join -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px">
        <tr>
          <td width="50%" valign="top" style="padding-right:6px">
            <div style="border:1px solid #f3f4f6;border-radius:12px;padding:20px;background:#fff">
              <p style="font-size:11px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 12px">Latest Investors to Join</p>
              ${invItems}
            </div>
          </td>
          <td width="50%" valign="top" style="padding-left:6px">
            <div style="border:1px solid #f3f4f6;border-radius:12px;padding:20px;background:#fff">
              <p style="font-size:11px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 12px">Latest Lenders to Join</p>
              ${lenItems}
            </div>
          </td>
        </tr>
      </table>

      <!-- Latest connections -->
      ${s.latestConnections.length > 0 ? `
      <div style="border:1px solid #f3f4f6;border-radius:12px;padding:16px 20px;background:#fff">
        <p style="font-size:11px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 12px">Latest Connections</p>
        ${connRows}
      </div>` : ''}
    </div>`
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
    'series-c': 'Series C',
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
