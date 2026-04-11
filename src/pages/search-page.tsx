import { useInfiniteQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { VendorCard } from '@/components/molecules/vendor-card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { productPath, ROUTES } from '@/constants/routes'
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'
import { useDebounceValue } from '@/hooks/use-debounce-value'
import { useToggleFavorite } from '@/hooks/use-toggle-favorite'
import { fetchDiscoverySearch } from '@/services/discovery.service'
import { useLocationStore } from '@/stores/location-store'
import type { ProductSearchHit, VendorSearchHit } from '@/types/discovery'
import { formatInr } from '@/utils/format'

export function SearchPage() {
  const navigate = useNavigate()
  const authed = useAuthStore(selectIsAuthenticated)
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQ = searchParams.get('q') ?? ''
  const [draft, setDraft] = useState(urlQ)
  const debounced = useDebounceValue(draft, 400)
  const { city } = useLocationStore()
  const fav = useToggleFavorite()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraft(urlQ)
  }, [urlQ])

  useEffect(() => {
    const t = debounced.trim()
    if (t === urlQ.trim()) return
    if (t.length === 0) {
      setSearchParams({}, { replace: true })
      return
    }
    setSearchParams({ q: t }, { replace: true })
  }, [debounced, setSearchParams, urlQ])

  const q = urlQ.trim()
  const enabled = q.length > 0

  const searchQuery = useInfiniteQuery({
    queryKey: [...queryKeys.discovery.search(q, city), 'paged'] as const,
    queryFn: ({ pageParam }) =>
      fetchDiscoverySearch({
        q,
        city,
        page: pageParam,
        limit: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const moreV = last.vendors.hasNext
      const moreP = last.products.hasNext
      if (moreV || moreP) return last.vendors.page + 1
      return undefined
    },
    enabled,
  })

  const { vendors, products } = useMemo(() => {
    const pages = searchQuery.data?.pages ?? []
    const vMap = new Map<string, VendorSearchHit>()
    const pMap = new Map<string, ProductSearchHit>()
    for (const page of pages) {
      for (const v of page.vendors.items) {
        if (!vMap.has(v.id)) vMap.set(v.id, v)
      }
      for (const p of page.products.items) {
        if (!pMap.has(p.id)) pMap.set(p.id, p)
      }
    }
    return {
      vendors: [...vMap.values()],
      products: [...pMap.values()],
    }
  }, [searchQuery.data])

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !searchQuery.hasNextPage || searchQuery.isFetchingNextPage)
      return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void searchQuery.fetchNextPage()
        }
      },
      { rootMargin: '120px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [searchQuery, vendors.length, products.length])

  return (
    <div className="space-y-6 pb-4">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          className="ps-9"
          placeholder="Search vendors or dishes…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Search"
        />
      </div>

      {!enabled ? (
        <p className="text-muted-foreground text-center text-sm">
          Type to search in {city}.
        </p>
      ) : searchQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : searchQuery.isError ? (
        <p className="text-destructive text-center text-sm">
          Something went wrong. Try again.
        </p>
      ) : vendors.length === 0 && products.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">
          No results for &ldquo;{q}&rdquo;.
        </p>
      ) : (
        <>
          {vendors.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold tracking-tight">
                Vendors
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {vendors.map((v) => (
                  <VendorCard
                    key={v.id}
                    id={v.id}
                    name={v.name}
                    logoUrl={v.logoUrl}
                    rating={v.rating}
                    totalRatings={v.totalRatings}
                    prepTime={v.prepTime}
                    isOpen={v.isOpen}
                    isFavorite={v.isFavorite}
                    onFavoriteClick={() => {
                      if (!authed) {
                        navigate(ROUTES.login, {
                          state: {
                            from: `${window.location.pathname}${window.location.search}`,
                          },
                        })
                        return
                      }
                      fav.mutate({ type: 'VENDOR', referenceId: v.id })
                    }}
                    favoriteLoading={fav.isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {products.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold tracking-tight">
                Dishes
              </h2>
              <ul className="space-y-2">
                {products.map((hit) => (
                  <li key={hit.id}>
                    <Link
                      to={productPath(hit.product.id)}
                      className="border-border/80 bg-card hover:border-primary/30 flex gap-3 rounded-xl border p-3 transition-colors"
                    >
                      <div className="bg-muted size-16 shrink-0 overflow-hidden rounded-lg">
                        {hit.product.imageUrl ? (
                          <img
                            src={hit.product.imageUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground flex size-full items-center justify-center text-lg font-medium">
                            {hit.product.name.slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{hit.product.name}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {hit.vendor.name}
                          {!hit.vendor.isOpen && (
                            <span className="text-amber-600 dark:text-amber-400">
                              {' '}
                              · Closed
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums">
                          {formatInr(hit.price)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div ref={loadMoreRef} className="h-8" />
          {searchQuery.isFetchingNextPage && (
            <p className="text-muted-foreground text-center text-xs">
              Loading more…
            </p>
          )}
        </>
      )}

      <p className="text-muted-foreground text-center text-xs">
        <Link to={ROUTES.home} className="underline-offset-2 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  )
}
