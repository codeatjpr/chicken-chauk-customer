import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductFavoriteButton } from '@/components/molecules/product-favorite-button'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { productPath, ROUTES } from '@/constants/routes'
import * as catalogApi from '@/services/catalog.service'

export function CategoryProductsPage() {
  const { categoryId = '' } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const categoryQuery = useQuery({
    queryKey: queryKeys.catalog.category(categoryId),
    queryFn: () => catalogApi.fetchCategoryById(categoryId),
    enabled: Boolean(categoryId),
  })

  const productsQuery = useInfiniteQuery({
    queryKey: queryKeys.catalog.products(categoryId),
    queryFn: ({ pageParam }) =>
      catalogApi.fetchProducts({
        categoryId,
        page: pageParam,
        limit: 24,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: Boolean(categoryId),
  })

  const items = useMemo(
    () => productsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [productsQuery.data],
  )

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !productsQuery.hasNextPage || productsQuery.isFetchingNextPage)
      return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void productsQuery.fetchNextPage()
        }
      },
      { rootMargin: '100px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [productsQuery, items.length])

  if (!categoryId) {
    return (
      <p className="text-muted-foreground text-sm">Invalid category link.</p>
    )
  }

  const cat = categoryQuery.data

  return (
    <div className="space-y-6 pb-10">
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

      {categoryQuery.isLoading ? (
        <Skeleton className="h-10 w-48" />
      ) : categoryQuery.isError || !cat ? (
        <p className="text-destructive text-sm">Category not found.</p>
      ) : (
        <header className="flex items-start gap-4">
          <div className="bg-muted size-14 shrink-0 overflow-hidden rounded-xl">
            {cat.imageUrl ? (
              <img src={cat.imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-muted-foreground flex size-full items-center justify-center text-lg font-semibold">
                {cat.name.slice(0, 1)}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{cat.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {cat._count.products} product
              {cat._count.products !== 1 ? 's' : ''} in this category
            </p>
          </div>
        </header>
      )}

      {productsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
          ))}
        </div>
      ) : productsQuery.isError ? (
        <p className="text-destructive text-sm">Could not load products.</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No products in this category yet.</p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <li key={p.id} className="relative">
                <ProductFavoriteButton
                  productId={p.id}
                  className="absolute end-2 top-2 z-10"
                />
                <Link
                  to={productPath(p.id)}
                  className="border-border/80 bg-card hover:border-primary/30 block overflow-hidden rounded-xl border transition-colors"
                >
                  <div className="bg-muted aspect-square w-full overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt=""
                        width={400}
                        height={400}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground flex size-full items-center justify-center text-2xl font-medium">
                        {p.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">
                      {p.name}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">{p.unit}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div ref={loadMoreRef} className="h-8" />
          {productsQuery.isFetchingNextPage && (
            <p className="text-muted-foreground py-4 text-center text-xs">
              Loading more…
            </p>
          )}
        </>
      )}
    </div>
  )
}
