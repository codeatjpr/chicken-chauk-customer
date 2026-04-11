import { createContext } from 'react'

export type I18nContextValue = {
  t: (key: string) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)
