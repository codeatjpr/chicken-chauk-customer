import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Scrolls the window to the top whenever the route changes (SPA navigation). */
export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search])

  return null
}
