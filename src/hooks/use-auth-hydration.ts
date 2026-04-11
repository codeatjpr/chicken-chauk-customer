import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'

/** True after zustand `persist` has rehydrated from `localStorage`. */
export function useAuthHydration(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated(),
  )

  useEffect(() => {
    return useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
  }, [])

  return hydrated
}
