export function friendlyError(raw: string): string {
  const msg = raw.toLowerCase()

  // ── Postgres constraint violations ────────────────────────────────────────
  if (msg.includes('raising_amount_usd_check')) {
    return 'Total raise amount must be greater than zero.'
  }
  if (msg.includes('why_now_check') || (msg.includes('check constraint') && msg.includes('why_now'))) {
    return 'The "In your own words" field is too long — maximum 500 characters.'
  }
  if (msg.includes('check constraint')) {
    return 'One of the values you entered is outside the allowed range. Please review the form and try again.'
  }
  if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
    return 'A profile already exists for this account. Please contact support if you need help.'
  }
  if (msg.includes('not-null constraint') || msg.includes('null value in column')) {
    return 'Please fill in all required fields.'
  }
  if (msg.includes('foreign key constraint')) {
    return 'Something went wrong with your account. Please contact support.'
  }

  // ── Supabase Auth errors ──────────────────────────────────────────────────
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials') || msg.includes('user not found')) {
    return 'Email or password is incorrect.'
  }
  if (msg.includes('email not confirmed')) {
    return 'email_not_confirmed'
  }
  if (msg.includes('password should be at least')) {
    return 'Password must be at least 8 characters.'
  }
  if (msg.includes('for security purposes') || msg.includes('after 60 seconds') || msg.includes('after 1 minute')) {
    return 'Please wait a moment before requesting another email.'
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts — please wait a few minutes and try again.'
  }
  if (msg.includes('token') && (msg.includes('invalid') || msg.includes('expired'))) {
    return 'Your reset link has expired or was already used. Please request a new one.'
  }

  // ── Generic fallback ──────────────────────────────────────────────────────
  return 'Something went wrong. Please try again, or contact support if the problem continues.'
}
