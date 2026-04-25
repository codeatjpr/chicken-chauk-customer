import type { ReactNode } from 'react'
import { Layers, Tags } from 'lucide-react'
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
  subCategoryName?: string | null
  unit?: string | null
  pieces?: string | null
  servings?: string | null
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
  subCategoryName,
  unit,
  pieces,
  servings,
  variantLabel,
  price,
  mrp,
  availabilityLabel,
  href,
  meta,
  action,
  className,
}: CommerceProductCardProps) {
  const pctOff =
    mrp != null && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null

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
          <div
            className={cn(
              'from-muted via-muted to-muted/60 shrink-0 overflow-hidden rounded-2xl bg-linear-to-br',
              'aspect-video w-[min(7.5rem,32vw)] sm:aspect-square sm:size-24',
            )}>
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
              {categoryName ? (
                <span className="border-primary/25 bg-primary/12 text-primary inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold sm:text-xs">
                  <Tags className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{categoryName}</span>
                </span>
              ) : null}
              {subCategoryName ? (
                <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800 dark:text-sky-200 sm:text-xs">
                  <Layers className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{subCategoryName}</span>
                </span>
              ) : null}
              {unit ? <Badge variant="outline">{unit}</Badge> : null}
              {pieces?.trim() ? <Badge variant="outline">{pieces.trim()}</Badge> : null}
              {servings?.trim() ? <Badge variant="outline">{servings.trim()}</Badge> : null}
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
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-lg font-semibold tracking-tight tabular-nums">
                {formatInr(price)}
              </p>
              {pctOff != null && pctOff > 0 ? (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  {pctOff}% OFF
                </span>
              ) : null}
            </div>
            {mrp != null && mrp > price ? (
              <p className="text-muted-foreground mt-0.5 text-xs">
                MRP <span className="line-through tabular-nums">{formatInr(mrp)}</span>
              </p>
            ) : null}
            <p className="text-muted-foreground mt-0.5 text-[10px]">(incl. of all taxes)</p>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}
