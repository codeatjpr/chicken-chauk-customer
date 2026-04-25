import { useCallback, useSyncExternalStore } from 'react'

/** `true` when viewport is at least `minWidth` (default Tailwind `md` = 768). */
export function useMinWidth(minWidth = 768) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(`(min-width: ${minWidth}px)`)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    [minWidth],
  )

  const getSnapshot = useCallback(() => {
    return window.matchMedia(`(min-width: ${minWidth}px)`).matches
  }, [minWidth])

  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
