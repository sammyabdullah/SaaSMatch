import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-32 text-center">
      <p className="text-gray-500 text-lg mb-2">
        A free platform connecting SaaS founders with SaaS investors.
      </p>
      <p className="text-gray-500 text-lg mb-12">
        Both sides apply and introductions happen only when there&apos;s mutual interest.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
      </div>
    </div>
  )
}
