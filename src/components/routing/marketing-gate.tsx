import { Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/landing-page'
import { ROUTES } from '@/constants/routes'
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'

/** Guest marketing splash at `/`; signed-in users go straight to the app home. */
export function MarketingGate() {
  const authed = useAuthStore(selectIsAuthenticated)
  if (authed) {
    return <Navigate to={ROUTES.home} replace />
  }
  return <LandingPage />
}
