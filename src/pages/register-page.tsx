import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthHeroPage } from '@/components/molecules/auth-hero-page'
import { SignupFlow } from '@/components/molecules/signup-flow'
import { ROUTES } from '@/constants/routes'

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.home

  return (
    <AuthHeroPage
      title="Create your account"
      subtitle="Enter your name and mobile number. We’ll verify with OTP."
      bottomLink={
        <p>
          Already have an account?{' '}
          <Link
            to={ROUTES.login}
            className="text-primary font-semibold underline-offset-2 hover:underline text-shadow-none"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <SignupFlow
        from={from}
        onSuccess={() => {
          navigate(from, { replace: true })
        }}
        onCancel={() => {
          navigate(ROUTES.home, { replace: true })
        }}
      />
    </AuthHeroPage>
  )
}
