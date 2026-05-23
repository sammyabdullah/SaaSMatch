'use server'

import { createClient } from '@/lib/supabase/server'

export async function triggerMonthlyDigest(): Promise<{
  ok?: boolean
  emailsSent?: number
  total?: number
  skipped?: boolean
  reason?: string
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Forbidden' }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(
    `${appUrl}/api/cron/monthly-digest?force=true`,
    {
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
      },
    }
  )

  if (!res.ok) {
    return { error: `Cron returned ${res.status}` }
  }

  return res.json()
}
