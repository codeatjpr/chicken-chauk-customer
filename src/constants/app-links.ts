/** Public store listing URLs — set in `.env` for production builds. */
export const PLAY_STORE_URL =
  (import.meta.env.VITE_PLAY_STORE_URL as string | undefined)?.trim() ||
  'https://play.google.com/store/search?q=Chicken+Chauk&c=apps'

export const APP_STORE_URL = (import.meta.env.VITE_APP_STORE_URL as string | undefined)?.trim() || ''
