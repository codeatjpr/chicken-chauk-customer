import { useCallback, useEffect, useState } from 'react'
import { Download, Share2, X } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const LS_NEVER = 'pwa-install-never'
const SS_DISMISS = 'pwa-install-dismiss-session'

type PwaInstallPromptProps = {
  /** `main`: clears mobile dock (`bottom-24`). `landing`: no dock, sit lower. */
  layout?: 'main' | 'landing'
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** iPhone / iPod / iPad — all browsers use “Add to Home Screen” via Share (no beforeinstallprompt). */
function isAppleMobile(): boolean {
  const ua = window.navigator.userAgent
  const isIpadOs =
    window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1
  return /iPad|iPhone|iPod/.test(ua) || isIpadOs
}

function isAndroid(): boolean {
  return /Android/i.test(window.navigator.userAgent)
}

function readNever(): boolean {
  try {
    return localStorage.getItem(LS_NEVER) === '1'
  } catch {
    return false
  }
}

function readSessionDismissed(): boolean {
  try {
    return sessionStorage.getItem(SS_DISMISS) === '1'
  } catch {
    return false
  }
}

export function PwaInstallPrompt({ layout = 'main' }: PwaInstallPromptProps) {
  const { t } = useI18n()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [neverAgain, setNeverAgain] = useState(readNever)
  const [sessionDismissed, setSessionDismissed] = useState(readSessionDismissed)

  useEffect(() => {
    if (isStandalone() || neverAgain || sessionDismissed) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [neverAgain, sessionDismissed])

  const dismissSession = useCallback(() => {
    try {
      sessionStorage.setItem(SS_DISMISS, '1')
    } catch {
      /* ignore */
    }
    setSessionDismissed(true)
    setDeferred(null)
  }, [])

  const dismissForever = useCallback(() => {
    try {
      localStorage.setItem(LS_NEVER, '1')
    } catch {
      /* ignore */
    }
    setNeverAgain(true)
    setDeferred(null)
  }, [])

  const onInstallClick = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }, [deferred])

  if (isStandalone() || neverAgain || sessionDismissed) return null

  const appleMobile = isAppleMobile()
  const android = isAndroid()

  const bodyKey = deferred
    ? 'pwa.body.withPrompt'
    : appleMobile
      ? 'pwa.body.ios'
      : android
        ? 'pwa.body.android'
        : 'pwa.body.desktop'

  const bottomClass = layout === 'main' ? 'bottom-24' : 'bottom-6'

  return (
    <div
      role="region"
      aria-label={t('pwa.region')}
      className={cn(
        'border-border bg-card/95 supports-[backdrop-filter]:bg-card/85 fixed right-3 left-3 z-50 flex max-w-md flex-col gap-3 rounded-xl border p-3 shadow-lg backdrop-blur sm:left-auto sm:w-full',
        bottomClass,
      )}
    >
      <div className="flex items-start gap-2">
        {appleMobile ? (
          <Share2 className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
        ) : (
          <Download className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold leading-snug">{t('pwa.title')}</p>
          <p className="text-muted-foreground text-sm leading-snug">{t(bodyKey)}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 -mr-1 -mt-1"
          onClick={dismissSession}
          aria-label={t('pwa.dismiss')}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-7">
        {deferred ? (
          <Button type="button" size="sm" onClick={() => void onInstallClick()}>
            {t('pwa.cta.install')}
          </Button>
        ) : (
          <Button type="button" size="sm" variant="secondary" onClick={dismissSession}>
            {t('pwa.cta.gotIt')}
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={dismissSession}>
          {t('pwa.notNow')}
        </Button>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground ml-auto text-xs underline-offset-2 hover:underline"
          onClick={dismissForever}
        >
          {t('pwa.neverAgain')}
        </button>
      </div>
    </div>
  )
}
