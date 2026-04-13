import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FounderDashboard from './founder-dashboard'
import InvestorDashboard from './investor-dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  if (profile.role === 'founder') {
    return <FounderDashboard userId={user.id} />
  }

  if (profile.role === 'investor') {
    return <InvestorDashboard userId={user.id} />
  }

  // Admin or unknown — redirect to admin or home
  if (profile.role === 'admin') redirect('/admin')
  redirect('/login')
}
