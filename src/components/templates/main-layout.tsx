import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/organisms/app-header'
import { AppSidebar } from '@/components/organisms/app-sidebar'
import { MobileTabBar } from '@/components/organisms/mobile-tab-bar'

export function MainLayout() {
  return (
    <div className="bg-background flex min-h-svh flex-col lg:flex-row">
      <AppSidebar />
      <div className="flex min-h-svh min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        <AppHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
