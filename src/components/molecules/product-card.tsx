import type { ReactNode } from 'react'
import { ArrowRight, Layers, Salad, Scale, Store, Tags, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductFavoriteButton } from '@/components/molecules/product-favorite-button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { stripHtmlToPlainText } from '@/lib/html'
import { cn } from '@/lib/utils'
import { formatInr } from '@/utils/format'

export type ProductCardPackInfo = {
  servings?: string | null
  weightLabel?: string | null
  pieces?: string | null
}

/** One line: `500 g | 12 pieces | Serves 4` (reference-style listing). */
function formatMinimalPackLine(info: ProductCardPackInfo | null | undefined): string | null {
  if (!info) return null
  const parts: string[] = []
  const w = info.weightLabel?.trim()
  if (w) parts.push(w)
  const p = info.pieces?.trim()
  if (p) {
    parts.push(/piece|pcs/i.test(p) ? p : `${p} pieces`)
  }
  const s = info.servings?.trim()
  if (s) {
    parts.push(/^serves?\s/i.test(s) ? s : `Serves ${s}`)
  }
  return parts.length > 0 ? parts.join(' | ') : null
}

type ProductCardProps = {
  to: string
  name: string
  imageUrl?: string | null
  description?: string | null
  categoryName?: string | null
  /** Shown on `minimal` as a chip (e.g. curry cut, boneless). */
  subCategoryName?: string | null
  unit?: string | null
  vendorName?: string | null
  price?: number | null
  mrp?: number | null
  favoriteProductId?: string
  eyebrow?: string
  badges?: string[]
  meta?: ReactNode
  /** Structured pack line: weight, pieces, serving (shown under the title). */
  packInfo?: ProductCardPackInfo | null
  /**
   * `minimal` = dense listing: title, optional sub-category + tags, short description, pack summary, vendor, price.
   */
  variant?: 'full' | 'minimal'
  /** Optional cart action — rendered as an overlay button on the price bar */
  cartAction?: ReactNode
  /** E‑commerce style corner tag (BEST SELLER / FRESH CUT). */
  merchLabel?: { text: string; tone?: 'primary' | 'success' } | null
  /** Portrait image + density tuned for search / PLP. */
  plpStyle?: boolean
  /** PLP list view: image left, details right. */
  listLayout?: boolean
  /** Show subcategory + category pills on the image (PLP / search). */
  imageCategoryPills?: boolean
  className?: string
}

export function ProductCard({
  to,
  name,
  imageUrl,
  description,
  categoryName,
  subCategoryName,
  unit,
  vendorName,
  price,
  mrp,
  favoriteProductId,
  eyebrow,
  badges = [],
  meta,
  packInfo,
  variant = 'full',
  cartAction,
  merchLabel,
  plpStyle = false,
  listLayout = false,
  imageCategoryPills: imageCategoryPillsProp = true,
  className,
}: ProductCardProps) {
  const isMinimal = variant === 'minimal'
  const rowList = isMinimal && listLayout
  const showBodyCategoryChips =
    isMinimal && Boolean(categoryName?.trim() || subCategoryName?.trim())
  const imageCategoryPills =
    imageCategoryPillsProp && !showBodyCategoryChips
  const packBits =
    packInfo &&
    [packInfo.weightLabel, packInfo.pieces, packInfo.servings].some(
      (v) => v != null && String(v).trim() !== '',
    )
  const showUnitBadge = Boolean(unit) && !packBits && !isMinimal

  const pctOff =
    price != null && mrp != null && mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : null

  const minimalPackLine = isMinimal ? formatMinimalPackLine(packInfo) : null
  const minimalDescriptionPlain =
    isMinimal && description?.trim()
      ? stripHtmlToPlainText(description)
      : null

  const pillSubCatFirst = [subCategoryName, categoryName].filter(Boolean) as string[]
  const categoryLine = [categoryName, subCategoryName].filter(Boolean).join(' · ')

  return (
    <Link to={to} className={cn('group block h-full', className)}>
      <Card
        className={cn(
          'border-border/70 bg-card h-full gap-0 overflow-hidden py-0 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-black/8',
          rowList && 'flex flex-row',
        )}
      >
        <div
          className={cn(
            'relative shrink-0',
            rowList && 'w-[min(40%,9.5rem)] sm:w-40',
            !rowList && 'w-full',
          )}
        >
          {merchLabel?.text ? (
            <span
              className={cn(
                'absolute top-2 left-2 z-[1] max-w-[85%] truncate rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white shadow-sm sm:text-[10px]',
                merchLabel.tone === 'success'
                  ? 'bg-emerald-600'
                  : 'bg-primary',
              )}
            >
              {merchLabel.text}
            </span>
          ) : null}
          <div
            className={cn(
              'from-muted via-muted to-muted/60 w-full overflow-hidden bg-linear-to-br',
              rowList
                ? 'aspect-square h-full min-h-28 min-w-28'
                : isMinimal && plpStyle
                  ? 'aspect-video sm:aspect-square'
                  : isMinimal
                    ? 'aspect-video sm:aspect-4/3'
                    : 'aspect-5/4',
            )}
          >
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
          {isMinimal &&
          plpStyle &&
          imageCategoryPills &&
          pillSubCatFirst.length > 0 ? (
            <div className="pointer-events-none absolute inset-x-1.5 bottom-1.5 z-[1] flex flex-wrap gap-1">
              {pillSubCatFirst.slice(0, 2).map((label) => (
                <span
                  key={label}
                  className="bg-background/95 text-foreground max-w-[45%] truncate rounded-full border border-black/10 px-2 py-0.5 text-[9px] font-semibold shadow-sm sm:text-[10px]"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
          {favoriteProductId ? (
            <ProductFavoriteButton
              productId={favoriteProductId}
              className="bg-background/90 shadow-xs absolute inset-e-1.5 top-1.5 z-[1] size-8 rounded-full p-0 ring-1 ring-black/5"
            />
          ) : null}
        </div>

        <CardContent
          className={cn(
            'flex min-w-0 flex-1 flex-col',
            isMinimal ? 'gap-2 p-2.5 sm:p-3' : 'gap-3 p-4',
            rowList && 'justify-center py-3',
          )}
        >
          {isMinimal ? (
            <>
              <div className="min-w-0 space-y-1.5">
                {showBodyCategoryChips ? (
                  <div className="flex flex-wrap items-start gap-2">
                    {categoryName?.trim() ? (
                      <span className="border-primary/25 bg-primary/12 text-primary inline-flex max-w-[48%] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:text-[11px]">
                        <Tags className="size-3 shrink-0 opacity-90" aria-hidden />
                        <span className="truncate">{categoryName}</span>
                      </span>
                    ) : null}
                    {subCategoryName?.trim() ? (
                      <span className="inline-flex max-w-[48%] items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-800 dark:text-sky-200 sm:text-[11px]">
                        <Layers className="size-3 shrink-0 opacity-90" aria-hidden />
                        <span className="truncate">{subCategoryName}</span>
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight sm:text-[15px]">
                  {name}
                </h3>
                {isMinimal && categoryLine && !showBodyCategoryChips ? (
                  <p className="text-foreground -mt-0.5 line-clamp-1 text-xs font-semibold sm:text-[13px]">
                    {categoryLine}
                  </p>
                ) : null}
                {((!isMinimal && subCategoryName) || badges.length > 0) ? (
                  <div className="flex flex-wrap gap-1">
                    {!isMinimal && subCategoryName ? (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-medium"
                      >
                        {subCategoryName}
                      </Badge>
                    ) : null}
                    {badges
                      .filter((b) => b !== subCategoryName)
                      .slice(0, 2)
                      .map((badge) => (
                        <Badge
                          key={badge}
                          variant="outline"
                          className="h-5 px-1.5 text-[10px] font-medium"
                        >
                          {badge}
                        </Badge>
                      ))}
                  </div>
                ) : null}
                {minimalDescriptionPlain ? (
                  <p className="text-muted-foreground line-clamp-2 text-[11px] leading-snug sm:text-xs">
                    {minimalDescriptionPlain}
                  </p>
                ) : null}
                {packBits && packInfo ? (
                  <div
                    className={cn(
                      'border-border/60 bg-muted/15 grid gap-1.5 rounded-xl border p-2',
                      [packInfo.weightLabel, packInfo.pieces, packInfo.servings].filter(
                        (v) => v != null && String(v).trim() !== '',
                      ).length === 1
                        ? 'grid-cols-1'
                        : [packInfo.weightLabel, packInfo.pieces, packInfo.servings].filter(
                              (v) => v != null && String(v).trim() !== '',
                            ).length === 2
                          ? 'grid-cols-2'
                          : 'grid-cols-3',
                    )}>
                    {packInfo.weightLabel?.trim() ? (
                      <div className="min-w-0 text-center">
                        <div className="text-emerald-600 dark:text-emerald-400 mx-auto mb-0.5 flex size-6 items-center justify-center rounded-md bg-emerald-500/15">
                          <Scale className="size-3" aria-hidden />
                        </div>
                        <p className="text-muted-foreground text-[9px] font-medium uppercase">Net</p>
                        <p className="text-foreground text-[10px] font-semibold tabular-nums leading-tight sm:text-[11px]">
                          {packInfo.weightLabel}
                        </p>
                      </div>
                    ) : null}
                    {packInfo.pieces?.trim() ? (
                      <div className="min-w-0 text-center">
                        <div className="mx-auto mb-0.5 flex size-6 items-center justify-center rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-300">
                          <Utensils className="size-3" aria-hidden />
                        </div>
                        <p className="text-muted-foreground text-[9px] font-medium uppercase">Pieces</p>
                        <p className="text-foreground text-[10px] font-semibold leading-tight sm:text-[11px]">
                          {packInfo.pieces}
                        </p>
                      </div>
                    ) : null}
                    {packInfo.servings?.trim() ? (
                      <div className="min-w-0 text-center">
                        <div className="text-primary mx-auto mb-0.5 flex size-6 items-center justify-center rounded-md bg-primary/12">
                          <Salad className="size-3" aria-hidden />
                        </div>
                        <p className="text-muted-foreground text-[9px] font-medium uppercase">Serves</p>
                        <p className="text-foreground text-[10px] font-semibold leading-tight sm:text-[11px]">
                          {packInfo.servings}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : minimalPackLine ? (
                  <p className="text-muted-foreground text-[11px] leading-snug sm:text-xs">
                    {minimalPackLine}
                  </p>
                ) : null}
                {vendorName ? (
                  <div className="text-muted-foreground flex items-start gap-1 text-[11px] leading-snug">
                    <Store className="mt-0.5 size-3 shrink-0" aria-hidden />
                    <span className="line-clamp-2">{vendorName}</span>
                  </div>
                ) : null}
              </div>
              {price != null ? (
                <div className="mt-auto flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-base font-semibold tracking-tight tabular-nums sm:text-lg">
                        {formatInr(price)}
                      </span>
                      {mrp != null && mrp > price ? (
                        <span className="text-muted-foreground text-sm line-through tabular-nums">
                          {formatInr(mrp)}
                        </span>
                      ) : null}
                      {pctOff != null && pctOff > 0 ? (
                        <span className="text-xs font-bold tracking-wide text-emerald-600 sm:text-sm">
                          {pctOff}% OFF
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {cartAction ? (
                    <div
                      className="shrink-0"
                      onClick={(e) => e.preventDefault()}
                    >
                      {cartAction}
                    </div>
                  ) : (
                    <span className="text-primary inline-flex items-center gap-1 text-xs font-semibold">
                      View
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-primary mt-auto inline-flex items-center gap-1 text-xs font-semibold">
                  Explore
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                {eyebrow ? (
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
                    {eyebrow}
                  </p>
                ) : null}
                {(categoryName || subCategoryName) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {categoryName ? (
                      <span className="border-primary/25 bg-primary/12 text-primary inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold">
                        <Tags className="size-3.5 shrink-0" aria-hidden />
                        {categoryName}
                      </span>
                    ) : null}
                    {subCategoryName ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:text-sky-200">
                        <Layers className="size-3.5 shrink-0" aria-hidden />
                        {subCategoryName}
                      </span>
                    ) : null}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {pctOff != null && pctOff > 0 ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/35 bg-emerald-500/12 font-semibold text-emerald-800 dark:text-emerald-200">
                      {pctOff}% OFF
                    </Badge>
                  ) : null}
                  {showUnitBadge ? <Badge variant="outline">{unit}</Badge> : null}
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
                  {packBits ? (
                    <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-snug">
                      {packInfo!.weightLabel ? (
                        <span>
                          <span className="text-muted-foreground/90 font-medium">
                            Weight
                          </span>{' '}
                          <span className="text-foreground font-medium tabular-nums">
                            {packInfo!.weightLabel}
                          </span>
                        </span>
                      ) : null}
                      {packInfo!.pieces ? (
                        <span>
                          <span className="text-muted-foreground/90 font-medium">
                            Pieces
                          </span>{' '}
                          <span className="text-foreground font-medium">
                            {packInfo!.pieces}
                          </span>
                        </span>
                      ) : null}
                      {packInfo!.servings ? (
                        <span>
                          <span className="text-muted-foreground/90 font-medium">
                            Serving
                          </span>{' '}
                          <span className="text-foreground font-medium">
                            {packInfo!.servings}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {description ? (
                    <p
                      className={cn(
                        'text-muted-foreground mt-1.5 text-sm leading-relaxed',
                        packBits ? 'line-clamp-4' : 'line-clamp-2',
                      )}
                    >
                      {stripHtmlToPlainText(description)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-auto space-y-2">
                {meta}
                {vendorName ? (
                  <div className="text-muted-foreground flex items-start gap-1.5 text-xs">
                    <Store
                      className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                      aria-hidden
                    />
                    <span className="line-clamp-2 leading-snug">{vendorName}</span>
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
                    {cartAction ? (
                      <div
                        className="shrink-0"
                        onClick={(e) => e.preventDefault()}
                      >
                        {cartAction}
                      </div>
                    ) : (
                      <span className="text-primary inline-flex items-center gap-1 text-xs font-semibold">
                        View
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-primary inline-flex items-center gap-1 text-xs font-semibold">
                    Explore
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
