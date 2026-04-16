import {
  Apple,
  Globe,
  MapPin,
  MessageCircleMore,
  Phone,
  Smartphone,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import logoMark from '@/assets/logo.png'
import nameLogo from '@/assets/name_logo.png'
import { ROUTES } from '@/constants/routes'

const footerSections = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', to: ROUTES.home },
      { label: 'All products', to: ROUTES.browse },
      { label: 'Search', to: ROUTES.search },
      { label: 'Help', to: ROUTES.help },
    ],
  },
  {
    title: 'Your account',
    links: [
      { label: 'Orders', to: ROUTES.orders },
      { label: 'Favorites', to: ROUTES.favorites },
      { label: 'Wallet', to: ROUTES.wallet },
      { label: 'Profile', to: ROUTES.profile },
    ],
  },
] as const

const socialIcons = [Globe, MessageCircleMore, Phone, Smartphone] as const

type SiteFooterProps = {
  locationLabel: string
}

export function SiteFooter({ locationLabel }: SiteFooterProps) {
  return (
    <footer className="border-border/70 bg-card/40 rounded-[2rem] border px-5 py-8 shadow-sm sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_repeat(2,minmax(0,0.8fr))_1fr]">
        <div className="space-y-4">
          <Link to={ROUTES.home} className="inline-flex items-center gap-3">
            <img
              src={logoMark}
              alt="Chicken Chauk"
              className="size-12 rounded-2xl object-contain"
            />
            <img
              src={nameLogo}
              alt="Chicken Chauk"
              className="hidden h-9 w-auto object-contain sm:block"
            />
          </Link>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            A modern meat marketplace for fresh chicken, mutton, seafood, eggs,
            and daily essentials delivered around {locationLabel}.
          </p>
          <div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
            <MapPin className="size-4" />
            Serving {locationLabel}
          </div>
        </div>

        {footerSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold tracking-tight">
              {section.title}
            </h3>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              {section.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Get the app</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Save your address, reorder faster, and keep checkout totals visible
              on every device.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-background inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium">
              <Apple className="size-4" />
              App Store
            </div>
            <div className="bg-background inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium">
              <Smartphone className="size-4" />
              Play Store
            </div>
          </div>
          <div className="flex items-center gap-2">
            {socialIcons.map((Icon, index) => (
              <span
                key={index}
                className="bg-background text-muted-foreground inline-flex size-10 items-center justify-center rounded-full border"
              >
                <Icon className="size-4" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-border/60 text-muted-foreground mt-8 flex flex-col gap-2 border-t pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>Prices may vary by vendor, availability, and delivery area.</p>
        <p>Taxes and additional charges are shown during checkout confirmation.</p>
      </div>
    </footer>
  )
}
