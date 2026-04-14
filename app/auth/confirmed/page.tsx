import Link from 'next/link'

export default function ConfirmedPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-32 text-center">
      <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-5 h-5 text-[#534AB7]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-3">
        Account confirmed
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Your email has been verified. Return to <span className="font-black tracking-widest uppercase text-sm"><span className="text-black">Unlocked</span><span className="text-[#29ABE2]">VC</span></span> to log in.
      </p>
      <Link
        href="/login"
        className="inline-block px-6 py-2.5 bg-[#534AB7] text-white text-sm font-medium rounded-md hover:bg-[#4339A0] transition-colors"
      >
        Log in
      </Link>
    </div>
  )
}
