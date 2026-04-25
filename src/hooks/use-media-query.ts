import { useEffect, useState } from 'react'

/** `true` when viewport is at least `minWidth` (default Tailwind `md` = 768). */
export function useMinWidth(minWidth = 768) {
  const [matches, setMatches] = useState(
    () => (typeof window !== 'undefined' ? window.matchMedia(`(min-width: ${minWidth}px)`).matches : false),
  )

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`)
    const onChange = () => setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    setMatches(mq.matches)
    return () => mq.removeEventListener('change', onChange)
  }, [minWidth])

  return matches
}
