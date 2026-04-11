import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/organisms/app-header'
import { AppSidebar } from '@/components/organisms/app-sidebar'
import { MobileTabBar } from '@/components/organisms/mobile-tab-bar'
import { useI18n } from '@/hooks/use-i18n'

export function MainLayout() {
  const { t } = useI18n()

  return (
    <div className="bg-background flex min-h-svh flex-col lg:flex-row">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground focus-visible:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:px-3 focus:py-2 focus:ring-2"
      >
        {t('a11y.skipToContent')}
      </a>
      <AppSidebar />
      <div className="flex min-h-svh min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        <AppHeader />
        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
