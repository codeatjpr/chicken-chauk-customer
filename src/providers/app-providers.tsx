import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { BrowserRouter } from 'react-router-dom'
import { AppErrorFallback } from '@/components/system/app-error-fallback'
import { DocumentTitleSync } from '@/components/system/document-title-sync'
import { SplashScreen } from '@/components/system/splash-screen'
import { Toaster } from '@/components/ui/sonner'
import { createQueryClient } from '@/lib/query-client'
import { I18nProvider } from '@/providers/i18n-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <ErrorBoundary
      FallbackComponent={AppErrorFallback}
      onReset={() => {
        window.location.assign('/')
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <BrowserRouter>
            <I18nProvider>
              <DocumentTitleSync />
              <SplashScreen />
              <div
                id="a11y-live-polite"
                className="sr-only"
                aria-live="polite"
                aria-atomic="true"
              />
              {children}
              <Toaster
                richColors
                position="top-center"
                closeButton
                containerAriaLabel="Notifications"
              />
            </I18nProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
