import {
  Apple,
  ArrowRight,
  Download,
  Globe,
  LayoutGrid,
  MapPin,
  MessageCircleMore,
  Phone,
  Search,
  Smartphone,
  Store,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { brandLogo } from '@/constants/brand-assets'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/constants/app-links'
import { ROUTES } from '@/constants/routes'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const socialIcons = [Globe, MessageCircleMore, Phone, Smartphone] as const

type SiteFooterProps = {
  locationLabel: string
}

export function SiteFooter({ locationLabel }: SiteFooterProps) {
  const hasAppStore = Boolean(APP_STORE_URL)

  return (
    <footer className="border-border/60 from-card/80 to-muted/30 rounded-[2rem] border bg-linear-to-b px-5 py-10 shadow-sm sm:px-8 lg:py-12">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-4 lg:col-span-5">
          <Link to={ROUTES.home} className="inline-flex items-center">
            <img
              src={brandLogo}
              alt="ChickenChauk"
              className="h-14 w-auto max-w-[260px] object-contain sm:h-16"
            />
          </Link>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            Fresh chicken, mutton, seafood, and essentials from trusted shops — delivered around{' '}
            {locationLabel}.
          </p>
          <div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
            <MapPin className="size-4 shrink-0" aria-hidden />
            Serving {locationLabel}
          </div>
        </div>

        <div className="lg:col-span-4">
          <h3 className="text-foreground text-sm font-semibold tracking-tight">Shop</h3>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Jump into the catalog or find a store near you.
          </p>
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Link
              to={ROUTES.browse}
              className={cn(
                buttonVariants({ size: 'default' }),
                'h-11 flex-1 gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm sm:min-w-[9.5rem]',
              )}>
              <LayoutGrid className="size-4" aria-hidden />
              Browse products
              <ArrowRight className="ms-auto size-4 opacity-80 sm:ms-0" aria-hidden />
            </Link>
            <Link
              to={ROUTES.stores}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
                'border-primary/35 text-foreground h-11 flex-1 gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm sm:min-w-[9.5rem]',
              )}>
              <Store className="text-primary size-4" aria-hidden />
              All shops
              <ArrowRight className="text-primary ms-auto size-4 opacity-80 sm:ms-0" aria-hidden />
            </Link>
            <Link
              to={ROUTES.search}
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'default' }),
                'h-11 w-full gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm sm:w-auto sm:min-w-[9.5rem]',
              )}>
              <Search className="size-4" aria-hidden />
              Search
            </Link>
          </div>
          <Link
            to={ROUTES.help}
            className="text-primary mt-4 inline-flex items-center gap-1 text-xs font-semibold hover:underline">
            Help &amp; support
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>

        <div className="space-y-4 lg:col-span-3">
          <h3 className="text-foreground text-sm font-semibold tracking-tight">Get the app</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Reorder faster with saved addresses and live order tracking.
          </p>
          <div className="flex flex-col gap-2.5">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'bg-foreground text-background hover:bg-foreground/90',
                'inline-flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-md transition-colors',
              )}>
              <Download className="size-6 shrink-0 opacity-95" aria-hidden />
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">Get it on</span>
                <span className="text-[0.95rem] font-bold">Google Play</span>
              </span>
            </a>
            {hasAppStore ? (
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'default' }),
                  'h-11 justify-center gap-2 rounded-xl border-2 font-semibold',
                )}>
                <Apple className="size-5" aria-hidden />
                App Store
              </a>
            ) : (
              <div
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'default' }),
                  'pointer-events-none h-11 justify-center gap-2 rounded-xl border-2 opacity-60',
                )}>
                <Apple className="size-5" aria-hidden />
                App Store — soon
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {socialIcons.map((Icon, index) => (
              <span
                key={index}
                className="bg-background text-muted-foreground inline-flex size-10 items-center justify-center rounded-full border shadow-sm">
                <Icon className="size-4" aria-hidden />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-border/60 text-muted-foreground mt-10 flex flex-col gap-2 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>Prices may vary by shop, availability, and delivery area.</p>
        <p>Taxes and additional charges are shown at checkout.</p>
      </div>
    </footer>
  )
}
