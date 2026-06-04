import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = 'FounderInvited <noreply@founderinvited.com>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'sammy@blossomstreetventures.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://founderinvited.com'

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

  await getResend().emails.send({
    from: FROM,
    to: investorEmail,
    subject: 'FounderInvited request',
    html: `
      <p>A founder in the FounderInvited network has flagged your profile and would like to connect.</p>

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

      <p style="color:#999;font-size:12px">You're receiving this because you have an approved investor profile on FounderInvited.</p>
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
      <p><strong>${investor.firm_name}</strong> (${investor.partner_name}) has flagged your profile on FounderInvited and would like to connect.</p>

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

      <p style="color:#999;font-size:12px">You're receiving this because you have an approved founder profile on FounderInvited.</p>
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

  await getResend().emails.send({
    from: FROM,
    to: founderEmail,
    subject: 'Connection request confirmed',
    html: `
      <p>You're now connected with ${firmLink} (${investorPartnerName}) on FounderInvited.</p>

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

  await getResend().emails.send({
    from: FROM,
    to: investorEmail,
    subject: 'Connection request confirmed',
    html: `
      <p>You're now connected with ${companyLink} on FounderInvited.</p>

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

  await getResend().emails.send({
    from: FROM,
    to: lenderEmail,
    subject: 'FounderInvited request',
    html: `
      <p>A founder in the FounderInvited network has expressed interest in connecting with you.</p>

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

      <p style="color:#999;font-size:12px">You're receiving this because you have an approved lender profile on FounderInvited.</p>
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
      <p><strong>${lender.institution_name}</strong> (${lender.contact_name}) has expressed interest in your company on FounderInvited.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Institution</td><td style="font-size:13px">${lender.institution_name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Contact</td><td style="font-size:13px">${lender.contact_name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Loan size</td><td style="font-size:13px">${loanRange}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stages</td><td style="font-size:13px">${stages}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Geography</td><td style="font-size:13px">${lender.geography_focus}</td></tr>
      </table>

      ${lender.thesis_statement ? `<p style="font-style:italic;color:#444">"${lender.thesis_statement}"</p>` : ''}

      <p>Log in to your dashboard to accept or decline this introduction.</p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>

      <p style="color:#999;font-size:12px">You're receiving this because you have an approved founder profile on FounderInvited.</p>
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
  const companyLink = founderWebsite
    ? `<a href="${founderWebsite}" style="color:#534AB7;text-decoration:none">${founderCompanyName ?? 'the company'}</a>`
    : founderCompanyName
      ? `<strong>${founderCompanyName}</strong>`
      : 'A founder'

  await getResend().emails.send({
    from: FROM,
    to: lenderEmail,
    subject: 'A founder accepted your connection request',
    html: `
      <p>Hi ${lenderName},</p>

      <p>${companyLink} has accepted your introduction request on FounderInvited.</p>

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
type FounderDigestParams = {
  founderEmail: string
  matchingInvestors: { firm_name: string; partner_name: string }[]
  matchingLenders: { institution_name: string; contact_name: string }[]
  platformStats: PlatformStats
}
export function buildMonthlyFounderDigestEmail({ founderEmail, matchingInvestors, matchingLenders, platformStats }: FounderDigestParams) {
  const investorRows = matchingInvestors.map(inv =>
    `<tr><td style="padding:2px 16px 2px 0;font-size:13px;width:200px"><strong>${inv.firm_name}</strong></td><td style="padding:2px 0;font-size:13px;color:#555">${inv.partner_name}</td></tr>`
  ).join('')
  const lenderRows = matchingLenders.map(l =>
    `<tr><td style="padding:2px 16px 2px 0;font-size:13px;width:200px"><strong>${l.institution_name}</strong></td><td style="padding:2px 0;font-size:13px;color:#555">${l.contact_name}</td></tr>`
  ).join('')
  return {
    from: FROM,
    to: founderEmail,
    subject: 'FounderInvited update',
    html: `<div style="max-width:600px;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      ${matchingInvestors.length > 0 || matchingLenders.length > 0
        ? '<p>Here are investors and lenders on FounderInvited that match your profile.</p>'
        : '<p>No new matches this month — here\'s what\'s happening on FounderInvited.</p>'
      }

      ${matchingInvestors.length > 0 ? `
        <p style="font-weight:600;margin:20px 0 6px">Matching investors (${matchingInvestors.length})</p>
        <table style="border-collapse:collapse">${investorRows}</table>
      ` : ''}

      ${matchingLenders.length > 0 ? `
        <p style="font-weight:600;margin:20px 0 6px">Matching lenders (${matchingLenders.length})</p>
        <table style="border-collapse:collapse">${lenderRows}</table>
      ` : ''}

      <p style="margin-top:28px"><a href="${APP_URL}/login" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Log In</a></p>

      ${buildPlatformStatsHtml(platformStats)}

      <p style="color:#999;font-size:12px;margin-top:24px">You're receiving this digest because you have an active founder profile on FounderInvited.</p>
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
  matchingFounders: { company_name: string; stage: string; product_categories: string[] }[]
  platformStats: PlatformStats
}
export function buildMonthlyInvestorDigestEmail({ investorEmail, matchingFounders, platformStats }: InvestorDigestParams) {
  const founderRows = matchingFounders.map(f =>
    `<tr>
      <td style="padding:2px 16px 2px 0;font-size:13px;width:200px"><strong>${f.company_name}</strong></td>
      <td style="padding:2px 16px 2px 0;font-size:13px;color:#555">${fmtStage(f.stage)}</td>
      <td style="padding:2px 0;font-size:13px;color:#888">${f.product_categories.join(', ')}</td>
    </tr>`
  ).join('')
  return {
    from: FROM,
    to: investorEmail,
    subject: 'FounderInvited update',
    html: `<div style="max-width:600px;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      ${matchingFounders.length > 0
        ? '<p>Here are active founders on FounderInvited that match your thesis this month.</p>'
        : '<p>No new matches this month — here\'s what\'s happening on FounderInvited.</p>'
      }

      ${matchingFounders.length > 0 ? `<table style="border-collapse:collapse;margin:8px 0">${founderRows}</table>` : ''}

      <p style="margin-top:28px"><a href="${APP_URL}/login" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Log In</a></p>

      ${buildPlatformStatsHtml(platformStats)}

      <p style="color:#999;font-size:12px;margin-top:24px">You're receiving this digest because you have an approved investor profile on FounderInvited.</p>
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
  matchingFounders: { company_name: string; stage: string; product_categories: string[] }[]
  platformStats: PlatformStats
}
export function buildMonthlyLenderDigestEmail({ lenderEmail, matchingFounders, platformStats }: LenderDigestParams) {
  const founderRows = matchingFounders.map(f =>
    `<tr>
      <td style="padding:2px 16px 2px 0;font-size:13px;width:200px"><strong>${f.company_name}</strong></td>
      <td style="padding:2px 16px 2px 0;font-size:13px;color:#555">${fmtStage(f.stage)}</td>
      <td style="padding:2px 0;font-size:13px;color:#888">${f.product_categories.join(', ')}</td>
    </tr>`
  ).join('')
  return {
    from: FROM,
    to: lenderEmail,
    subject: 'FounderInvited update',
    html: `<div style="max-width:600px;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      ${matchingFounders.length > 0
        ? '<p>Here are active founders on FounderInvited that match your lending criteria this month.</p>'
        : '<p>No new matches this month — here\'s what\'s happening on FounderInvited.</p>'
      }

      ${matchingFounders.length > 0 ? `<table style="border-collapse:collapse;margin:8px 0">${founderRows}</table>` : ''}

      <p style="margin-top:28px"><a href="${APP_URL}/login" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Log In</a></p>

      ${buildPlatformStatsHtml(platformStats)}

      <p style="color:#999;font-size:12px;margin-top:24px">You're receiving this digest because you have an approved lender profile on FounderInvited.</p>
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
