import { Suspense } from 'react'
import SignupForm from './signup-form'

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-6 py-24 text-sm text-gray-400">
          Loading…
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
