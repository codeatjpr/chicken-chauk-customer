import { Loader2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Waits for persisted auth to load, then validates the session with `/auth/me`
 * when tokens exist.
 */
export function SessionGate() {
  const [persistReady, setPersistReady] = useState(
    () => useAuthStore.persist.hasHydrated(),
  )
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const sessionReady = useAuthStore((s) => s.sessionReady)

  useEffect(() => {
    const markReady = () => setPersistReady(true)

    if (useAuthStore.persist.hasHydrated()) {
      requestAnimationFrame(markReady)
    }
    const unsub = useAuthStore.persist.onFinishHydration(markReady)
    // Catch hydration that finished after the sync check but before subscribe ran.
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (useAuthStore.persist.hasHydrated()) markReady()
      })
    })
    // Persist can fail without flipping hasHydrated (e.g. corrupt storage); do not block forever.
    const failOpen = window.setTimeout(() => {
      if (!useAuthStore.persist.hasHydrated()) {
        // Rare: persist error path or missed listener; still allow the app to render.
        markReady()
      }
    }, 1_500)
    return () => {
      window.cancelAnimationFrame(raf1)
      window.cancelAnimationFrame(raf2)
      unsub()
      window.clearTimeout(failOpen)
    }
  }, [])

  useEffect(() => {
    if (!persistReady) return
    void bootstrap()
  }, [persistReady, bootstrap])

  if (!persistReady || !sessionReady) {
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
