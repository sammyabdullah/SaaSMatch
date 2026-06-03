// send-samples.js — run with: node send-samples.js your@email.com
// Requires: npm install resend   (or: npm install -g resend)
//
// Set your Resend API key either via env var or replace the placeholder below:
//   Windows:  set RESEND_API_KEY=re_xxxx
//   Mac/Linux: export RESEND_API_KEY=re_xxxx

const { Resend } = require('resend')

const RESEND_API_KEY = process.env.RESEND_API_KEY || 'PASTE_YOUR_RESEND_API_KEY_HERE'
const TO_EMAIL = process.argv[2]

if (!TO_EMAIL) {
  console.error('Usage: node send-samples.js your@email.com')
  process.exit(1)
}
if (RESEND_API_KEY === 'PASTE_YOUR_RESEND_API_KEY_HERE') {
  console.error('Set RESEND_API_KEY env var or paste your key into this file.')
  process.exit(1)
}

const resend = new Resend(RESEND_API_KEY)

const FROM = 'FounderInvited <noreply@founderinvited.com>'
const APP_URL = 'https://founderinvited.com'

// ── Sample data ───────────────────────────────────────────────────────────────

const samplePlatformStats = {
  investorCount: 42,
  lenderCount: 18,
  latestInvestors: [
    { firm_name: 'Sequoia Capital', partner_name: 'Roelof Botha' },
    { firm_name: 'Benchmark', partner_name: 'Bill Gurley' },
    { firm_name: 'Andreessen Horowitz', partner_name: 'Marc Andreessen' },
    { firm_name: 'Accel Partners', partner_name: 'Sonali De Rycker' },
    { firm_name: 'Founders Fund', partner_name: 'Peter Thiel' },
  ],
  latestLenders: [
    { institution_name: 'Silicon Valley Bank', contact_name: 'Jennifer Park' },
    { institution_name: 'Western Technology Investment', contact_name: 'David Teten' },
    { institution_name: 'Lighter Capital', contact_name: 'BJ Lackland' },
  ],
  latestConnections: [
    { left: 'Sequoia Capital', right: 'Acme Corp' },
    { left: 'Silicon Valley Bank', right: 'TechFlow Inc' },
    { left: 'Benchmark', right: 'DataStream AI' },
    { left: 'Lighter Capital', right: 'GrowthPulse' },
    { left: 'Founders Fund', right: 'NexGen SaaS' },
  ],
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function formatUsd(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fmtStage(s) {
  const map = {
    'pre-seed': 'Pre-Seed',
    seed: 'Seed',
    'series-a': 'Series A',
    'series-b': 'Series B',
    'series-c': 'Series C',
  }
  return map[s] ?? s
}

function buildPlatformStatsHtml(s) {
  const invItems = s.latestInvestors.map((inv, i) => `
    <div style="${i > 0 ? 'border-top:1px solid #f3f4f6;padding-top:10px;margin-top:10px' : ''}">
      <p style="font-size:13px;font-weight:600;color:#111827;margin:0">${inv.firm_name}</p>
      <p style="font-size:12px;color:#6b7280;margin:2px 0 0">${inv.partner_name}</p>
    </div>`).join('')

  const lenItems = s.latestLenders.map((l, i) => `
    <div style="${i > 0 ? 'border-top:1px solid #f3f4f6;padding-top:10px;margin-top:10px' : ''}">
      <p style="font-size:13px;font-weight:600;color:#111827;margin:0">${l.institution_name}</p>
      <p style="font-size:12px;color:#6b7280;margin:2px 0 0">${l.contact_name}</p>
    </div>`).join('')

  const connRows = s.latestConnections.map((c, i) => `
    <div style="${i > 0 ? 'border-top:1px solid #f3f4f6;padding-top:10px;margin-top:10px' : ''}">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;font-weight:600;color:#111827;width:38%">${c.left}</td>
          <td style="font-size:12px;color:#9ca3af;text-align:center">just connected with</td>
          <td style="font-size:13px;font-weight:600;color:#111827;text-align:right;width:38%">${c.right}</td>
        </tr>
      </table>
    </div>`).join('')

  return `
    <div style="margin-top:36px;border-top:1px solid #e5e7eb;padding-top:24px">
      <p style="font-size:11px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 16px">Platform activity</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px">
        <tr>
          <td width="50%" style="padding-right:6px">
            <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px;text-align:center">
              <p style="font-size:10px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 4px">Live Investors on Unlocked</p>
              <p style="font-size:28px;font-weight:700;color:#534AB7;margin:0">${s.investorCount}</p>
            </div>
          </td>
          <td width="50%" style="padding-left:6px">
            <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px;text-align:center">
              <p style="font-size:10px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 4px">Live Lenders on Unlocked</p>
              <p style="font-size:28px;font-weight:700;color:#534AB7;margin:0">${s.lenderCount}</p>
            </div>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px">
        <tr>
          <td width="50%" valign="top" style="padding-right:6px">
            <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px">
              <p style="font-size:10px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 12px">Latest Investors to Join</p>
              ${invItems}
            </div>
          </td>
          <td width="50%" valign="top" style="padding-left:6px">
            <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px">
              <p style="font-size:10px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 12px">Latest Lenders to Join</p>
              ${lenItems}
            </div>
          </td>
        </tr>
      </table>

      <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px">
        <p style="font-size:10px;color:#9ca3af;letter-spacing:0.05em;text-transform:uppercase;margin:0 0 12px;text-align:center">Latest Connections</p>
        ${connRows}
      </div>
    </div>`
}

// ── Email senders ─────────────────────────────────────────────────────────────

async function sendFounderSample() {
  const matchingInvestors = [
    { firm_name: 'Sequoia Capital', partner_name: 'Roelof Botha' },
    { firm_name: 'Benchmark', partner_name: 'Bill Gurley' },
    { firm_name: 'Andreessen Horowitz', partner_name: 'Marc Andreessen' },
  ]
  const matchingLenders = [
    { institution_name: 'Silicon Valley Bank', contact_name: 'Jennifer Park' },
    { institution_name: 'Lighter Capital', contact_name: 'BJ Lackland' },
  ]

  const investorRows = matchingInvestors.map(inv =>
    `<tr><td style="padding:2px 16px 2px 0;font-size:13px;width:200px"><strong>${inv.firm_name}</strong></td><td style="padding:2px 0;font-size:13px;color:#555">${inv.partner_name}</td></tr>`
  ).join('')

  const lenderRows = matchingLenders.map(l =>
    `<tr><td style="padding:2px 16px 2px 0;font-size:13px;width:200px"><strong>${l.institution_name}</strong></td><td style="padding:2px 0;font-size:13px;color:#555">${l.contact_name}</td></tr>`
  ).join('')

  const r1 = await resend.emails.send({
    from: FROM,
    to: TO_EMAIL,
    subject: 'FounderInvited update (founder sample)',
    html: `
      <p>Here are investors and lenders on FounderInvited that match your profile.</p>

      <p style="font-weight:600;margin:20px 0 6px">Matching investors (${matchingInvestors.length})</p>
      <table style="border-collapse:collapse">${investorRows}</table>

      <p style="font-weight:600;margin:20px 0 6px">Matching lenders (${matchingLenders.length})</p>
      <table style="border-collapse:collapse">${lenderRows}</table>

      <p style="margin-top:28px"><a href="${APP_URL}/login" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Log In</a></p>

      ${buildPlatformStatsHtml(samplePlatformStats)}

      <p style="color:#999;font-size:12px;margin-top:24px">You're receiving this digest because you have an active founder profile on FounderInvited.</p>
    `,
  })
  if (r1.error) throw new Error(`Founder: ${r1.error.message}`)
  console.log('✓ Founder digest sent')
}

async function sendInvestorSample() {
  const matchingFounders = [
    { company_name: 'Acme Corp', stage: 'seed', product_categories: ['Vertical SaaS', 'AI/ML'] },
    { company_name: 'TechFlow Inc', stage: 'series-a', product_categories: ['FinTech', 'Payments'] },
    { company_name: 'DataStream AI', stage: 'pre-seed', product_categories: ['AI/ML', 'Analytics'] },
    { company_name: 'GrowthPulse', stage: 'seed', product_categories: ['MarTech', 'Vertical SaaS'] },
  ]

  const founderRows = matchingFounders.map(f =>
    `<tr>
      <td style="padding:2px 16px 2px 0;font-size:13px;width:200px"><strong>${f.company_name}</strong></td>
      <td style="padding:2px 16px 2px 0;font-size:13px;color:#555">${fmtStage(f.stage)}</td>
      <td style="padding:2px 0;font-size:13px;color:#888">${f.product_categories.join(', ')}</td>
    </tr>`
  ).join('')

  const r2 = await resend.emails.send({
    from: FROM,
    to: TO_EMAIL,
    subject: 'FounderInvited update (investor sample)',
    html: `
      <p>Here are active founders on FounderInvited that match your thesis this month.</p>

      <table style="border-collapse:collapse;margin:8px 0">${founderRows}</table>

      <p style="margin-top:28px"><a href="${APP_URL}/login" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Log In</a></p>

      ${buildPlatformStatsHtml(samplePlatformStats)}

      <p style="color:#999;font-size:12px;margin-top:24px">You're receiving this digest because you have an approved investor profile on FounderInvited.</p>
    `,
  })
  if (r2.error) throw new Error(`Investor: ${r2.error.message}`)
  console.log('✓ Investor digest sent')
}

async function sendLenderSample() {
  const matchingFounders = [
    { company_name: 'Acme Corp', stage: 'seed', product_categories: ['Vertical SaaS', 'AI/ML'] },
    { company_name: 'NexGen SaaS', stage: 'series-a', product_categories: ['DevTools', 'Infrastructure'] },
    { company_name: 'CloudBase', stage: 'series-b', product_categories: ['Security', 'DevTools'] },
  ]

  const founderRows = matchingFounders.map(f =>
    `<tr>
      <td style="padding:2px 16px 2px 0;font-size:13px;width:200px"><strong>${f.company_name}</strong></td>
      <td style="padding:2px 16px 2px 0;font-size:13px;color:#555">${fmtStage(f.stage)}</td>
      <td style="padding:2px 0;font-size:13px;color:#888">${f.product_categories.join(', ')}</td>
    </tr>`
  ).join('')

  const r3 = await resend.emails.send({
    from: FROM,
    to: TO_EMAIL,
    subject: 'FounderInvited update (lender sample)',
    html: `
      <p>Here are active founders on FounderInvited that match your lending criteria this month.</p>

      <table style="border-collapse:collapse;margin:8px 0">${founderRows}</table>

      <p style="margin-top:28px"><a href="${APP_URL}/login" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Log In</a></p>

      ${buildPlatformStatsHtml(samplePlatformStats)}

      <p style="color:#999;font-size:12px;margin-top:24px">You're receiving this digest because you have an approved lender profile on FounderInvited.</p>
    `,
  })
  if (r3.error) throw new Error(`Lender: ${r3.error.message}`)
  console.log('✓ Lender digest sent')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Sending 3 sample digest emails to ${TO_EMAIL} …\n`)
  await sendFounderSample()
  await sendInvestorSample()
  await sendLenderSample()
  console.log('\nDone. Check your inbox.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
