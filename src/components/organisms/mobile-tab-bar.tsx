import { Home, Search, Package, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const tabs = [
  { to: ROUTES.home, label: 'Home', icon: Home },
  { to: ROUTES.search, label: 'Search', icon: Search },
  { to: ROUTES.orders, label: 'Orders', icon: Package },
  { to: ROUTES.profile, label: 'Profile', icon: User },
] as const

export function MobileTabBar() {
  return (
    <nav
      className="border-border/80 bg-background/95 fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch justify-around border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Main"
    >
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'text-muted-foreground flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
              isActive && 'text-primary',
            )
          }
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
