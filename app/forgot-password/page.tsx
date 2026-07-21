import ForgotPasswordForm from './form'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams
  return <ForgotPasswordForm expiredLink={params.error === 'link_expired'} />
}
