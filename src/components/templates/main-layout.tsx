import { Outlet } from 'react-router-dom'
import { AppBreadcrumb } from '@/components/organisms/app-breadcrumb'
import { AppHeader } from '@/components/organisms/app-header'
import { MobileFloatingDock } from '@/components/organisms/mobile-floating-dock'
import { PwaInstallPrompt } from '@/components/system/pwa-install-prompt'
import { useI18n } from '@/hooks/use-i18n'

export function MainLayout() {
  const { t } = useI18n()

  return (
    <div className="bg-background min-h-svh">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground focus-visible:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:rounded-md focus:px-3 focus:py-2 focus:ring-2"
      >
        {t('a11y.skipToContent')}
      </a>
      <div className="flex min-h-svh min-w-0 flex-col pb-40 lg:pb-0">
        <AppHeader />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-4 sm:px-4 lg:px-6"
          tabIndex={-1}
        >
          <AppBreadcrumb />
          <Outlet />
        </main>
      </div>
      <MobileFloatingDock />
      <PwaInstallPrompt />
    </div>
  )
}
