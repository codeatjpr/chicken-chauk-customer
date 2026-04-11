import { Heart, Home, Search, Package, User, Wallet } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const links = [
  { to: ROUTES.home, label: 'Home', icon: Home, guestOk: true },
  { to: ROUTES.search, label: 'Search', icon: Search, guestOk: true },
  { to: ROUTES.orders, label: 'Orders', icon: Package, guestOk: false },
  { to: ROUTES.favorites, label: 'Favorites', icon: Heart, guestOk: false },
  { to: ROUTES.wallet, label: 'Wallet', icon: Wallet, guestOk: false },
  { to: ROUTES.profile, label: 'Profile', icon: User, guestOk: false },
] as const

const itemClass = (active: boolean) =>
  cn(
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    active
      ? 'bg-primary/12 text-primary'
      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
  )

export function AppSidebar() {
  const location = useLocation()
  const authed = useAuthStore(selectIsAuthenticated)
  const loginState = {
    from: `${location.pathname}${location.search}${location.hash}`,
  }

  return (
    <aside className="border-border/80 bg-card/40 hidden w-60 shrink-0 flex-col border-e lg:flex">
      <div className="font-heading border-border/60 flex h-14 items-center border-b px-4 text-lg font-semibold">
        Menu
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Sidebar">
        {links.map(({ to, label, icon: Icon, guestOk }) => {
          if (!authed && !guestOk) {
            return (
              <Link
                key={to}
                to={ROUTES.login}
                state={loginState}
                className={itemClass(false)}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </Link>
            )
          }

          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => itemClass(isActive)}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
