import { Heart, Home, Search, Package, User, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const links = [
  { to: ROUTES.home, label: 'Home', icon: Home },
  { to: ROUTES.search, label: 'Search', icon: Search },
  { to: ROUTES.orders, label: 'Orders', icon: Package },
  { to: ROUTES.favorites, label: 'Favorites', icon: Heart },
  { to: ROUTES.wallet, label: 'Wallet', icon: Wallet },
  { to: ROUTES.profile, label: 'Profile', icon: User },
] as const

export function AppSidebar() {
  return (
    <aside className="border-border/80 bg-card/40 hidden w-60 shrink-0 flex-col border-e lg:flex">
      <div className="font-heading border-border/60 flex h-14 items-center border-b px-4 text-lg font-semibold">
        Menu
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Sidebar">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
