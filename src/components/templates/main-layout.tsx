import { Outlet, useLocation } from 'react-router-dom'
import { AppBreadcrumb } from '@/components/organisms/app-breadcrumb'
import { AppHeader } from '@/components/organisms/app-header'
import { CartAddChips } from '@/components/molecules/cart-add-chips'
import { MobileFloatingDock } from '@/components/organisms/mobile-floating-dock'
import { ROUTES } from '@/constants/routes'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'

export function MainLayout() {
  const { t } = useI18n()
  const { pathname } = useLocation()

  const mobileMainTopPad =
    pathname === ROUTES.home
      ? 'max-lg:pt-[calc(7.1rem+env(safe-area-inset-top,0px))]'
      : pathname === ROUTES.search
        ? 'max-lg:pt-[calc(7.65rem+env(safe-area-inset-top,0px))]'
        : 'max-lg:pt-[calc(4rem+env(safe-area-inset-top,0px))]'

  return (
    <div className="min-h-svh bg-zinc-50">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground focus-visible:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:rounded-md focus:px-3 focus:py-2 focus:ring-2"
      >
        {t('a11y.skipToContent')}
      </a>
      <div className="flex min-h-svh min-w-0 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
        <AppHeader />
        <main
          id="main-content"
          className={cn(
            'mx-auto w-full max-w-[1400px] flex-1 px-3 py-4 sm:px-4 lg:px-6',
            mobileMainTopPad,
            'lg:pt-4',
          )}
          tabIndex={-1}
        >
          <AppBreadcrumb />
          <Outlet />
        </main>
      </div>
      <CartAddChips />
      <MobileFloatingDock />
    </div>
  )
}
