import { Home, Package, Search, User } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const tabs = [
  { to: ROUTES.home, label: 'Home', icon: Home, guestOk: true },
  { to: ROUTES.search, label: 'Search', icon: Search, guestOk: true },
  { to: ROUTES.orders, label: 'Orders', icon: Package, guestOk: false },
  { to: ROUTES.profile, label: 'Profile', icon: User, guestOk: false },
] as const

const tabClass = (active: boolean) =>
  cn(
    'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
    active ? 'text-primary' : 'text-muted-foreground',
  )

export function MobileTabBar() {
  const location = useLocation()
  const authed = useAuthStore(selectIsAuthenticated)
  const loginState = {
    from: `${location.pathname}${location.search}${location.hash}`,
  }

  return (
    <nav
      className="border-border/80 bg-background/95 fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch justify-around border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Main"
    >
      {tabs.map(({ to, label, icon: Icon, guestOk }) => {
        if (!authed && !guestOk) {
          return (
            <Link
              key={to}
              to={ROUTES.login}
              state={loginState}
              className={tabClass(false)}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          )
        }

        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => tabClass(isActive)}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </NavLink>
        )
      })}
    </nav>
  )
}
