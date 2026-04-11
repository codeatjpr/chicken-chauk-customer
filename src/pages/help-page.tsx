import { ArrowLeft, LifeBuoy } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

export function HelpPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Link
          to={ROUTES.profile}
          className="text-muted-foreground text-sm hover:underline"
        >
          Account
        </Link>
      </div>

      <div className="flex items-start gap-3">
        <LifeBuoy className="text-primary mt-0.5 size-7 shrink-0" aria-hidden />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Help</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Quick answers for ordering and delivery.
          </p>
        </div>
      </div>

      <div className="border-border/80 bg-card space-y-4 rounded-xl border p-4 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold tracking-tight">Orders and payment</h2>
          <p className="text-muted-foreground mt-2">
            After checkout, you can pay online from the order screen when
            required. Cash on delivery (COD) is collected when the rider arrives.
          </p>
        </section>
        <section>
          <h2 className="font-semibold tracking-tight">Delivery tracking</h2>
          <p className="text-muted-foreground mt-2">
            When a rider is assigned, open your order and use{' '}
            <strong className="text-foreground font-medium">Live tracking</strong>{' '}
            to follow progress on the map.
          </p>
        </section>
        <section>
          <h2 className="font-semibold tracking-tight">Wallet and coupons</h2>
          <p className="text-muted-foreground mt-2">
            Apply valid coupons and optional wallet balance at checkout. Final
            amounts are always confirmed by the server when you place the order.
          </p>
        </section>
        <section>
          <h2 className="font-semibold tracking-tight">Need more help?</h2>
          <p className="text-muted-foreground mt-2">
            Contact support through the details shared by your city team or
            vendor — this screen is a lightweight in-app guide.
          </p>
        </section>
      </div>
    </div>
  )
}
