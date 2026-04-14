import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'SaaSMatch <noreply@blossomstreetventures.com>'
const ADMIN_EMAIL = 'sammy@blossomstreetventures.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://saa-s-match.vercel.app'

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
    mom_growth_pct: number
    nrr_pct: number
    why_now: string
    location: string
  }
}) {
  const categoryList = founder.product_categories.join(', ')
  const raise = formatUsd(founder.raising_amount_usd)

  await resend.emails.send({
    from: FROM,
    to: investorEmail,
    subject: 'SaaSMatch request',
    html: `
      <p>A founder in the SaaSMatch network has flagged your profile and would like to connect.</p>

      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stage</td><td style="font-size:13px">${fmtStage(founder.stage)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">ARR range</td><td style="font-size:13px">${fmtArr(founder.arr_range)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Raising</td><td style="font-size:13px">${raise}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">MoM growth</td><td style="font-size:13px">${founder.mom_growth_pct}%</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">NRR</td><td style="font-size:13px">${founder.nrr_pct}%</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Categories</td><td style="font-size:13px">${categoryList}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${founder.location}</td></tr>
      </table>

      ${founder.why_now ? `<p style="font-style:italic;color:#444">"${founder.why_now}"</p>` : ''}

      <p>Log in to your dashboard to accept or decline this introduction.</p>

      <p><a href="${APP_URL}/dashboard" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View in Dashboard</a></p>

      <p style="color:#999;font-size:12px">You're receiving this because you have an approved investor profile on SaaSMatch.</p>
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
    subject: 'SaaSMatch request',
    html: `
      <p><strong>${investor.firm_name}</strong> (${investor.partner_name}) has flagged your profile on SaaSMatch and would like to connect.</p>

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

      <p style="color:#999;font-size:12px">You're receiving this because you have an approved founder profile on SaaSMatch.</p>
    `,
  })
}

// ─── Connection accepted — notify the initiating founder ─────────────────────
export async function sendConnectionAcceptedFounderEmail({
  founderEmail,
  investorFirmName,
  investorPartnerName,
  investorEmail,
}: {
  founderEmail: string
  investorFirmName: string
  investorPartnerName: string
  investorEmail: string
}) {
  await resend.emails.send({
    from: FROM,
    to: founderEmail,
    subject: `${investorFirmName} accepted your connection request`,
    html: `
      <p>Great news! <strong>${investorFirmName}</strong> (${investorPartnerName}) has accepted your introduction request on SaaSMatch.</p>

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
  founderCategories,
  founderStage,
}: {
  investorEmail: string
  investorName: string
  founderEmail: string
  founderCategories: string[]
  founderStage: string
}) {
  await resend.emails.send({
    from: FROM,
    to: investorEmail,
    subject: 'A founder accepted your connection request',
    html: `
      <p>Hi ${investorName},</p>

      <p>A founder has accepted your introduction request on SaaSMatch.</p>

      <p><strong>Stage:</strong> ${fmtStage(founderStage)}<br>
      <strong>Categories:</strong> ${founderCategories.join(', ')}</p>

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
      <p>A new connection was made on SaaSMatch.</p>
      <p><strong>Founder:</strong> ${founderEmail}<br>
      <strong>Investor:</strong> ${investorFirmName} (${investorEmail})<br>
      <strong>Initiated by:</strong> ${initiatedBy}</p>
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
