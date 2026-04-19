import { useEffect, useState } from 'react'
import { useI18n } from '@/hooks/use-i18n'

const STORAGE_KEY = 'cc_splash_seen_session'
const MIN_MS = 1_400
const FADE_MS = 450

function initialPhase(): 'show' | 'gone' {
  if (typeof window === 'undefined') return 'gone'
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') return 'gone'
  } catch {
    /* private mode */
  }
  return 'show'
}

/**
 * Full-screen launch splash (mobile browser + PWA standalone + desktop).
 * Shown once per tab session; uses your logo from /favicon.svg.
 * Native iOS/Android PWA splash still comes from manifest icons; this runs after JS loads.
 */
export function SplashScreen() {
  const { t } = useI18n()
  const [phase, setPhase] = useState<'show' | 'fade' | 'gone'>(() =>
    initialPhase() === 'gone' ? 'gone' : 'show',
  )

  useEffect(() => {
    if (phase !== 'show') return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'show') return
    const t1 = window.setTimeout(() => setPhase('fade'), MIN_MS)
    return () => window.clearTimeout(t1)
  }, [phase])

  useEffect(() => {
    if (phase !== 'fade') return
    const t2 = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* ignore */
      }
      setPhase('gone')
    }, FADE_MS)
    return () => window.clearTimeout(t2)
  }, [phase])

  if (phase === 'gone') return null

  const fading = phase === 'fade'

  return (
    <div
      role="presentation"
      aria-hidden={fading}
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0f172a] px-6 transition-opacity duration-[450ms] ease-out motion-reduce:transition-none ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex max-w-sm flex-col items-center gap-6 text-center">
        <div className="ring-primary/15 rounded-3xl bg-white/5 p-5 ring-1 ring-inset">
          <img
            src="/favicon.svg"
            alt=""
            width={120}
            height={120}
            className="h-28 w-28 shrink-0 object-contain"
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-primary-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('splash.brand')}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed sm:text-base">{t('splash.tagline')}</p>
        </div>
        <div
          className="from-primary/80 to-primary mt-2 h-1 w-20 rounded-full bg-gradient-to-r via-orange-400/90"
          aria-hidden
        />
      </div>
    </div>
  )
}
