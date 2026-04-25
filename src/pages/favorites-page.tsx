import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Heart, Star, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { productPath, vendorPath } from '@/constants/routes'
import * as favoritesApi from '@/services/favorites.service'
import { cn } from '@/lib/utils'
import { useState } from 'react'

type Tab = 'vendors' | 'products'

export function FavoritesPage() {
  const [mobileTab, setMobileTab] = useState<Tab>('vendors')

  const favQuery = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: () => favoritesApi.fetchFavorites(),
  })

  const data = favQuery.data

  return (
    <div className="pb-10 lg:pb-12">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <Heart className="text-primary size-6 shrink-0" aria-hidden />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Saved</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Shops near you and items you have saved.
          </p>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="mb-5 flex gap-2 lg:hidden">
        {(['vendors', 'products'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setMobileTab(t)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              mobileTab === t
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/70 bg-card hover:bg-muted/50',
            )}
          >
            {t === 'vendors' ? 'Shops' : 'Items'}
            {data && (
              <span className="ml-1.5 text-xs opacity-60">
                ({t === 'vendors' ? data.vendors.length : data.products.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {favQuery.isLoading ? (
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="space-y-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
          <div className="mt-6 space-y-3 lg:mt-0">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
      ) : favQuery.isError ? (
        <p className="text-destructive text-sm">Could not load favorites.</p>
      ) : !data ? null : (
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">

          {/* ── LEFT: Saved shops ── */}
          <div className={cn(mobileTab !== 'vendors' && 'hidden lg:block')}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold lg:text-lg">
                Shops near you
                {data.vendors.length > 0 && (
                  <span className="text-muted-foreground ml-2 text-sm font-normal">
                    ({data.vendors.length})
                  </span>
                )}
              </h2>
            </div>

            {data.vendors.length === 0 ? (
              <div className="border-border/60 rounded-2xl border border-dashed px-6 py-12 text-center">
                <Store className="text-muted-foreground/30 mx-auto mb-3 size-8" />
                <p className="text-muted-foreground text-sm">
                  No saved shops yet. Tap the heart on a shop to save it.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {data.vendors.map((v) => (
                  <li key={v.id}>
                    <Link
                      to={vendorPath(v.id)}
                      className="border-border/70 bg-card hover:bg-muted/40 hover:border-primary/30 flex items-center gap-4 rounded-2xl border p-4 transition-colors"
                    >
                      <div className="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                        {v.logoUrl ? (
                          <img src={v.logoUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="text-muted-foreground text-xl font-semibold">
                            {v.name.slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{v.name}</p>
                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="flex items-center gap-0.5">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            {v.rating.toFixed(1)}
                          </span>
                          <span>·</span>
                          <span className={cn(
                            'font-medium',
                            v.isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                          )}>
                            {v.isOpen ? 'Open now' : 'Closed'}
                          </span>
                          <span>·</span>
                          <span>{v.prepTime} min</span>
                        </div>
                      </div>
                      <ArrowRight className="text-primary size-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── RIGHT: Saved items ── */}
          <div className={cn(mobileTab !== 'products' && 'hidden lg:block')}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold lg:text-lg">
                Items
                {data.products.length > 0 && (
                  <span className="text-muted-foreground ml-2 text-sm font-normal">
                    ({data.products.length})
                  </span>
                )}
              </h2>
            </div>

            {data.products.length === 0 ? (
              <div className="border-border/60 rounded-2xl border border-dashed px-6 py-12 text-center">
                <Heart className="text-muted-foreground/30 mx-auto mb-3 size-8" />
                <p className="text-muted-foreground text-sm">
                  No saved items yet. Save products from a menu to see them here.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {data.products.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={productPath(p.id)}
                      className="border-border/70 bg-card hover:bg-muted/40 hover:border-primary/30 flex items-center gap-4 rounded-2xl border p-4 transition-colors"
                    >
                      {/* Product image */}
                      <div className="bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="text-muted-foreground text-xl font-semibold">
                            {p.name.slice(0, 1)}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate font-semibold">{p.name}</p>

                        {/* Category + unit row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-medium">
                            {p.category.name}
                          </span>
                          <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-[11px] font-medium">
                            {p.unit}
                          </span>
                        </div>

                        {/* Added date */}
                        {p.addedAt && (
                          <p className="text-muted-foreground text-[11px]">
                            Saved{' '}
                            {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                              new Date(p.addedAt),
                            )}
                          </p>
                        )}
                      </div>

                      <ArrowRight className="text-primary size-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
