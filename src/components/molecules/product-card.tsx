import type { ReactNode } from 'react'
import { ArrowRight, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductFavoriteButton } from '@/components/molecules/product-favorite-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatInr } from '@/utils/format'

type ProductCardProps = {
  to: string
  name: string
  imageUrl?: string | null
  description?: string | null
  categoryName?: string | null
  unit?: string | null
  vendorName?: string | null
  price?: number | null
  mrp?: number | null
  favoriteProductId?: string
  eyebrow?: string
  badges?: string[]
  meta?: ReactNode
  className?: string
}

export function ProductCard({
  to,
  name,
  imageUrl,
  description,
  categoryName,
  unit,
  vendorName,
  price,
  mrp,
  favoriteProductId,
  eyebrow,
  badges = [],
  meta,
  className,
}: ProductCardProps) {
  return (
    <Link to={to} className={cn('group block h-full', className)}>
      <Card className="border-border/70 bg-card h-full gap-0 overflow-hidden py-0 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-black/8 dark:ring-white/10 dark:hover:ring-white/14">
        <div className="relative">
          <div className="from-muted via-muted to-muted/60 aspect-5/4 w-full overflow-hidden bg-linear-to-br">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                width={640}
                height={512}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center text-4xl font-semibold">
                {name.slice(0, 1)}
              </div>
            )}
          </div>
          {favoriteProductId ? (
            <ProductFavoriteButton
              productId={favoriteProductId}
              className="absolute inset-e-3 top-3"
            />
          ) : null}
        </div>

        <CardContent className="flex flex-1 flex-col gap-3 p-4">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
                {eyebrow}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {categoryName ? <Badge variant="secondary">{categoryName}</Badge> : null}
              {unit ? <Badge variant="outline">{unit}</Badge> : null}
              {badges.map((badge) => (
                <Badge key={badge} variant="outline">
                  {badge}
                </Badge>
              ))}
            </div>
            <div>
              <h3 className="line-clamp-2 text-base font-semibold tracking-tight">
                {name}
              </h3>
              {description ? (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-relaxed">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-auto space-y-2">
            {meta}
            {vendorName ? (
              <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                <Store className="size-3.5" aria-hidden />
                <span className="line-clamp-1">{vendorName}</span>
              </div>
            ) : null}
            {price != null ? (
              <div className="flex items-end justify-between gap-3">
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
                <span className="text-primary inline-flex items-center gap-1 text-xs font-semibold">
                  View
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            ) : (
              <span className="text-primary inline-flex items-center gap-1 text-xs font-semibold">
                Explore
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
