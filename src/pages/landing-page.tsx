import { Link, Navigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'

export function LandingPage() {
  const authed = useAuthStore(selectIsAuthenticated)

  if (authed) {
    return <Navigate to={ROUTES.home} replace />
  }

  return (
    <div className="bg-background relative min-h-svh">
      <header className="border-border/60 flex items-center justify-between border-b px-4 py-3">
        <span className="font-heading text-lg font-semibold tracking-tight">
          Chicken Chauk
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to={ROUTES.login}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-16 text-center">
        <div className="space-y-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Fresh meat, delivered in 60 minutes
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            From verified local vendors directly to your door.
          </p>
        </div>
        <Link
          to={ROUTES.login}
          className={cn(buttonVariants({ size: 'lg' }))}
        >
          Order now
        </Link>
        <p className="text-muted-foreground text-sm">
          Already have an account?{' '}
          <Link
            to={ROUTES.login}
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </main>
    </div>
  )
}
