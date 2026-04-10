import { getUser } from '@/lib/auth'

export default async function DashboardPage() {
  const { profile } = await getUser()

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-sm text-gray-500">
        Signed in as{' '}
        <span className="font-medium text-gray-700">{profile.role}</span>.
        The matching interface is coming next.
      </p>
    </div>
  )
}
