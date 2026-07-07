import ForgotPasswordForm from './form'

interface Props {
  searchParams: { error?: string }
}

export default function ForgotPasswordPage({ searchParams }: Props) {
  return <ForgotPasswordForm expiredLink={searchParams.error === 'link_expired'} />
}
