import type { ReactNode } from 'react'
import loginBanner from '@/assets/login_banner.jpg'
import { brandLogo } from '@/constants/brand-assets'
import { Shield } from 'lucide-react'

type AuthHeroPageProps = {
  title: string
  subtitle: string
  children: ReactNode
  belowCard?: ReactNode
  /** Optional block below the card (e.g. extra actions) */
  bottomLink?: ReactNode
  /** Extra content inside card under children, before shield line */
  cardFooter?: ReactNode
}

export function AuthHeroPage({
  title,
  subtitle,
  children,
  belowCard,
  bottomLink,
  cardFooter,
}: AuthHeroPageProps) {
  return (
    <div className="relative min-h-svh w-full overflow-x-hidden">
      <div
        className="absolute inset-0 z-0"
        aria-hidden
      >
        <img
          src={loginBanner}
          alt=""
          className="h-full w-full min-h-svh object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="relative z-10 flex min-h-svh w-full flex-col items-center justify-center px-4 py-8 sm:px-6 lg:py-10">
        <div className="flex w-full max-w-md flex-col items-center">
          <div className="bg-card/98 border-border/50 w-full rounded-3xl border p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex flex-col items-center gap-3 text-center">
              <img
                src={brandLogo}
                alt="ChickenChauk"
                className="h-[6.75rem] w-auto max-w-full object-contain sm:h-32"
              />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              <p className="text-muted-foreground text-sm sm:text-base">{subtitle}</p>
            </div>

            {children}
            {cardFooter}

            <p className="text-muted-foreground mt-6 flex items-center justify-center gap-1.5 text-center text-xs">
              <Shield className="text-muted-foreground/80 size-3.5 shrink-0" aria-hidden />
              Your data is safe and secure with us
            </p>
          </div>

          {belowCard ? <div className="mt-8 w-full text-center">{belowCard}</div> : null}
          {bottomLink ? (
            <div className="mt-6 w-full text-center text-sm text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.65)]">
              {bottomLink}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
