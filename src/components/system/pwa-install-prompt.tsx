import { useCallback, useEffect, useState } from 'react'
import { Download, Share2, X } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
import { Button } from '@/components/ui/button'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    // iOS Safari added-to-home
    ((window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const webkit = /WebKit/.test(ua)
  return iOS && webkit && !/CriOS|FxiOS|EdgiOS/.test(ua)
}

const IOS_HINT_KEY = 'pwa-ios-hint-shown'

/** iOS has no beforeinstallprompt — one-time hint uses lazy state, not setState in an effect. */
function shouldShowIosHintInitially(): boolean {
  try {
    if (isStandalone()) return false
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return false
    if (!isIosSafari()) return false
    if (sessionStorage.getItem(IOS_HINT_KEY)) return false
    return true
  } catch {
    return false
  }
}

export function PwaInstallPrompt() {
  const { t } = useI18n()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(shouldShowIosHintInitially)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (isStandalone() || dismissed) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [dismissed])

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
    setDeferred(null)
    setShowIosHint(false)
  }, [])

  const dismissIosHint = useCallback(() => {
    try {
      sessionStorage.setItem(IOS_HINT_KEY, '1')
    } catch {
      /* ignore */
    }
    setShowIosHint(false)
  }, [])

  const onInstallClick = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }, [deferred])

  if (isStandalone() || dismissed) return null

  if (deferred) {
    return (
      <div
        role="region"
        aria-label={t('pwa.install.region')}
        className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 fixed right-3 bottom-24 left-3 z-50 flex max-w-md flex-col gap-2 rounded-xl border p-3 shadow-lg backdrop-blur sm:left-auto sm:w-full"
      >
        <div className="flex items-start gap-2">
          <Download className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm leading-snug">{t('pwa.install.body')}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 -mr-1 -mt-1"
            onClick={dismiss}
            aria-label={t('pwa.install.dismiss')}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 pl-7">
          <Button type="button" size="sm" onClick={() => void onInstallClick()}>
            {t('pwa.install.cta')}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={dismiss}>
            {t('pwa.install.notNow')}
          </Button>
        </div>
      </div>
    )
  }

  if (showIosHint) {
    return (
      <div
        role="region"
        aria-label={t('pwa.ios.region')}
        className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 fixed right-3 bottom-24 left-3 z-50 flex max-w-md items-start gap-2 rounded-xl border p-3 shadow-lg backdrop-blur sm:left-auto sm:w-full"
      >
        <Share2 className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
        <p className="text-sm leading-snug">{t('pwa.ios.body')}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 -mr-1 -mt-1"
          onClick={dismissIosHint}
          aria-label={t('pwa.install.dismiss')}
        >
          <X className="size-4" />
        </Button>
      </div>
    )
  }

  return null
}
