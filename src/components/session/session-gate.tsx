import { Loader2Icon } from 'lucide-react'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthHydration } from '@/hooks/use-auth-hydration'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Waits for persisted auth to load, then validates the session with `/auth/me`
 * when tokens exist.
 */
export function SessionGate() {
  const hydrated = useAuthHydration()
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const sessionReady = useAuthStore((s) => s.sessionReady)

  useEffect(() => {
    if (!hydrated) return
    void bootstrap()
  }, [hydrated, bootstrap])

  if (!hydrated || !sessionReady) {
    return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-3">
        <Loader2Icon
          className="text-primary size-8 animate-spin"
          aria-hidden
        />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  return <Outlet />
}
