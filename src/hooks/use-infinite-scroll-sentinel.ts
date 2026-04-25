import { type RefObject, useEffect, useRef } from 'react'

type Args = {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<unknown>
  /** Bump when the observed node appears or the list resets (e.g. filters) so we re-attach. */
  watchKey?: string | number
  enabled?: boolean
  rootMargin?: string
}

/**
 * Loads the next infinite-query page when `sentinelRef` enters the viewport.
 * Uses a ref for fetch state so the IntersectionObserver callback is never stale.
 */
export function useInfiniteScrollSentinel(
  sentinelRef: RefObject<Element | null>,
  {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    watchKey = 0,
    enabled = true,
    rootMargin = '280px',
  }: Args,
) {
  const stateRef = useRef({ hasNextPage, isFetchingNextPage, fetchNextPage })
  stateRef.current = { hasNextPage, isFetchingNextPage, fetchNextPage }

  useEffect(() => {
    if (!enabled) return
    const el = sentinelRef.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        const s = stateRef.current
        if (!s.hasNextPage || s.isFetchingNextPage) return
        void s.fetchNextPage()
      },
      { root: null, rootMargin, threshold: 0 },
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [enabled, fetchNextPage, rootMargin, sentinelRef, watchKey])
}
