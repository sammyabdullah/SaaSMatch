import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const NOTIFY_EMAIL = 'sammy@blossomstreetventures.com'
const FROM = 'UnlockedVC <noreply@unlockedvc.com>'

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  const apiKey = process.env.RESEND_API_KEY
  if (!secret || !apiKey) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }
  const resend = new Resend(apiKey)

  const rawBody = await req.text()

  let event
  try {
    event = resend.webhooks.verify({
      webhookSecret: secret,
      payload: rawBody,
      headers: {
        id: req.headers.get('svix-id') ?? '',
        timestamp: req.headers.get('svix-timestamp') ?? '',
        signature: req.headers.get('svix-signature') ?? '',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  if (event.type === 'email.bounced' || event.type === 'email.failed') {
    const data = event.data as {
      to?: string[]
      subject?: string
      created_at?: string
    }
    const to = data.to?.join(', ') ?? 'unknown'
    const subject = data.subject ?? 'unknown'

    await resend.emails.send({
      from: FROM,
      to: NOTIFY_EMAIL,
      subject: `⚠️ Email bounce on UnlockedVC — ${to}`,
      html: `
        <p>An email sent from UnlockedVC bounced or failed to deliver.</p>
        <table cellpadding="6" style="font-size:13px;color:#333">
          <tr><td style="color:#666">Recipient</td><td>${to}</td></tr>
          <tr><td style="color:#666">Subject</td><td>${subject}</td></tr>
          <tr><td style="color:#666">Event</td><td>${event.type}</td></tr>
          <tr><td style="color:#666">Time</td><td>${data.created_at ?? new Date().toISOString()}</td></tr>
        </table>
        <p style="color:#888;font-size:12px">You may want to follow up with this user directly or remove them from the platform.</p>
      `,
    })
  }

  return NextResponse.json({ received: true })
}
