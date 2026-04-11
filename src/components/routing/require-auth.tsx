import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'

export function RequireAuth() {
  const location = useLocation()
  const authed = useAuthStore(selectIsAuthenticated)

  if (!authed) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    )
  }

  return <Outlet />
}
