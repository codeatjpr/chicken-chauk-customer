import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'

export function GuestLayout() {
  const authed = useAuthStore(selectIsAuthenticated)

  if (authed) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <Outlet />
}
