import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { buttonVariants } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'

export function LandingPage() {
  const { t } = useI18n()

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
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            {t('landing.signInCta')}
          </Link>
        </div>
      </header>

      <main
        id="marketing-main"
        className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-16 text-center"
      >
        <div className="space-y-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('landing.title')}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            {t('landing.subtitle')}
          </p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={ROUTES.home}
            className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
          >
            {t('landing.browse')}
          </Link>
          <Link
            to={ROUTES.login}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'w-full sm:w-auto',
            )}
          >
            {t('landing.orderNow')}
          </Link>
        </div>
        <p className="text-muted-foreground text-sm">
          {t('landing.footer')}{' '}
          <Link
            to={ROUTES.login}
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            {t('landing.signInCta')}
          </Link>
        </p>
      </main>
    </div>
  )
}
