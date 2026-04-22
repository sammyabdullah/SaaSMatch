import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const admin = createAdminClient()

  const [
    { count: investorCount },
    { count: lenderCount },
    { data: lastInvestor },
    { data: lastLender },
  ] = await Promise.all([
    admin.from('investor_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('lender_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('investor_profiles').select('firm_name, partner_name').eq('is_approved', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('lender_profiles').select('institution_name, contact_name').eq('is_approved', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  return (
    <div className="max-w-2xl mx-auto px-6 py-32 text-center">
      <p className="text-gray-500 text-base mb-1">
        A free platform connecting SaaS founders with SaaS investors.
      </p>
      <p className="text-gray-500 text-base mb-12">
        Welcome.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
        <Link
          href="/signup?role=founder"
          className="px-8 py-3 bg-[#534AB7] text-white rounded-md text-sm font-medium hover:bg-[#4339A0] transition-colors"
        >
          I&apos;m a founder
        </Link>
        <Link
          href="/signup?role=investor"
          className="px-8 py-3 border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:border-gray-400 transition-colors"
        >
          I&apos;m an investor
        </Link>
        <Link
          href="/signup?role=lender"
          className="px-8 py-3 border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:border-gray-400 transition-colors"
        >
          I&apos;m a lender
        </Link>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm text-center">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Live Investors on Unlocked</p>
          <p className="text-3xl font-bold text-[#534AB7]">{investorCount ?? 0}</p>
        </div>
        <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm text-center">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Live Lenders on Unlocked</p>
          <p className="text-3xl font-bold text-[#534AB7]">{lenderCount ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm text-left">
          <p className="text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Last Investor to Join</p>
          {lastInvestor ? (
            <>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{lastInvestor.firm_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{lastInvestor.partner_name}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
        </div>
        <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm text-left">
          <p className="text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Last Lender to Join</p>
          {lastLender ? (
            <>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{lastLender.institution_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{lastLender.contact_name}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
        </div>
      </div>
    </div>
  )
}
