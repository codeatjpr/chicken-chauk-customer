import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Heart } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { productPath, ROUTES, vendorPath } from '@/constants/routes'
import * as favoritesApi from '@/services/favorites.service'
import { cn } from '@/lib/utils'

type Tab = 'vendors' | 'products'

export function FavoritesPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('vendors')

  const favQuery = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: () => favoritesApi.fetchFavorites(),
  })

  const data = favQuery.data

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
          to={ROUTES.home}
          className="text-muted-foreground text-sm hover:underline"
        >
          Home
        </Link>
      </div>

      <div className="flex items-start gap-3">
        <Heart className="text-primary mt-0.5 size-7 shrink-0" aria-hidden />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Favorites</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Restaurants and dishes you have saved.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {(
          [
            { id: 'vendors' as const, label: 'Restaurants' },
            { id: 'products' as const, label: 'Dishes' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              tab === t.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/80 bg-card hover:bg-muted/50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {favQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : favQuery.isError ? (
        <p className="text-destructive text-sm">Could not load favorites.</p>
      ) : !data ? null : tab === 'vendors' ? (
        data.vendors.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No favorite restaurants yet. Tap the heart on a restaurant to save
            it.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.vendors.map((v) => (
              <li key={v.id}>
                <Link
                  to={vendorPath(v.id)}
                  className="border-border/80 bg-card hover:bg-muted/40 flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{v.name}</p>
                    <p className="text-muted-foreground text-xs">
                      ★ {v.rating.toFixed(1)} ·{' '}
                      {v.isOpen ? 'Open' : 'Closed'} · {v.prepTime} min
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">View</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : data.products.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No favorite dishes yet. Save items from a menu to see them here.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.products.map((p) => (
            <li key={p.id}>
              <Link
                to={productPath(p.id)}
                className="border-border/80 bg-card hover:bg-muted/40 flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {p.category.name} · {p.unit}
                  </p>
                </div>
                <span className="text-muted-foreground text-xs">View</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
