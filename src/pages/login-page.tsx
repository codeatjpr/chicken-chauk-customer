import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthHeroPage } from '@/components/molecules/auth-hero-page'
import { LoginFlow } from '@/components/molecules/login-flow'
import { ROUTES } from '@/constants/routes'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.home

  return (
    <AuthHeroPage
      title="Welcome back!"
      subtitle="Sign in to continue to your account"
      bottomLink={
        <p>
          New to Chicken Chauk?{' '}
          <Link
            to={ROUTES.register}
            className="text-primary font-semibold underline-offset-2 hover:underline text-shadow-none"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <LoginFlow
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
