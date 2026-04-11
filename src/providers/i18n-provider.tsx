import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import en from '@/locales/en.json'
import { I18nContext, type I18nContextValue } from '@/lib/i18n-context'

const catalog = en as Record<string, string>

/** English copy only; `t(key)` reads from `locales/en.json`. */
export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = 'en'
    document.documentElement.dir = 'ltr'
  }, [])

  const t = useCallback(
    (key: string) => catalog[key] ?? key,
    [],
  )

  const value = useMemo<I18nContextValue>(() => ({ t }), [t])

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  )
}
