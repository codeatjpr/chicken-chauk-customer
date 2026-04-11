import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import '@/lib/auth-interceptors'
import { initSentry } from '@/lib/sentry'
import App from '@/App'
import { AppProviders } from '@/providers/app-providers'

initSentry()

void import('virtual:pwa-register').then(({ registerSW }) => {
  registerSW({ immediate: true })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
