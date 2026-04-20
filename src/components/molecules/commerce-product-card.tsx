import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { stripHtmlToPlainText } from '@/lib/html'
import { cn } from '@/lib/utils'
import { formatInr } from '@/utils/format'

type CommerceProductCardProps = {
  name: string
  imageUrl?: string | null
  description?: string | null
  categoryName?: string | null
  unit?: string | null
  variantLabel?: string | null
  price: number
  mrp?: number | null
  availabilityLabel?: string
  href?: string
  meta?: ReactNode
  action?: ReactNode
  className?: string
}

export function CommerceProductCard({
  name,
  imageUrl,
  description,
  categoryName,
  unit,
  variantLabel,
  price,
  mrp,
  availabilityLabel,
  href,
  meta,
  action,
  className,
}: CommerceProductCardProps) {
  const title = href ? (
    <Link to={href} className="hover:text-primary transition-colors">
      {name}
    </Link>
  ) : (
    name
  )

  return (
    <Card
      className={cn(
        'border-border/70 bg-card gap-0 overflow-hidden py-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10',
        className,
      )}
    >
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          <div className="from-muted via-muted to-muted/60 size-24 shrink-0 overflow-hidden rounded-2xl bg-linear-to-br">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                width={192}
                height={192}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center text-2xl font-semibold">
                {name.slice(0, 1)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              {categoryName ? <Badge variant="secondary">{categoryName}</Badge> : null}
              {unit ? <Badge variant="outline">{unit}</Badge> : null}
              {variantLabel ? <Badge variant="outline">{variantLabel}</Badge> : null}
              {availabilityLabel ? (
                <Badge variant={availabilityLabel === 'Available' ? 'secondary' : 'outline'}>
                  {availabilityLabel}
                </Badge>
              ) : null}
            </div>

            <div className="mt-3 space-y-1">
              <h3 className="line-clamp-2 text-base font-semibold tracking-tight">
                {title}
              </h3>
              {description ? (
                <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                  {stripHtmlToPlainText(description)}
                </p>
              ) : null}
            </div>

            {meta ? <div className="mt-3">{meta}</div> : null}
          </div>
        </div>

        <div className="bg-muted/40 flex items-center justify-between gap-4 border-t px-4 py-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight tabular-nums">
              {formatInr(price)}
            </p>
            {mrp != null && mrp > price ? (
              <p className="text-muted-foreground text-xs">
                <span className="line-through">{formatInr(mrp)}</span>
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}
