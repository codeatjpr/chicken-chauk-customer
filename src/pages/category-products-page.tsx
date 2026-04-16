import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Grid2x2, PackageSearch } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CategoryPill } from '@/components/molecules/category-pill'
import { ProductCard } from '@/components/molecules/product-card'
import { Button } from '@/components/ui/button'
import {
  ProductGrid,
  ProductGridEmptyState,
  ProductGridSkeleton,
} from '@/components/organisms/product-grid'
import { queryKeys } from '@/constants/query-keys'
import { productPath, ROUTES } from '@/constants/routes'
import * as catalogApi from '@/services/catalog.service'
import { fetchDiscoveryProducts } from '@/services/discovery.service'
import { useLocationStore } from '@/stores/location-store'

export function CategoryProductsPage() {
  const { categoryId = '' } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const { city } = useLocationStore()

  const categoryQuery = useQuery({
    queryKey: queryKeys.catalog.category(categoryId),
    queryFn: () => catalogApi.fetchCategoryById(categoryId),
    enabled: Boolean(categoryId),
  })

  const productsQuery = useInfiniteQuery({
    queryKey: queryKeys.discovery.products(city, categoryId),
    queryFn: ({ pageParam }) =>
      fetchDiscoveryProducts({
        city,
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
        <ProductGridSkeleton count={1} className="grid-cols-1" />
      ) : categoryQuery.isError || !cat ? (
        <p className="text-destructive text-sm">Category not found.</p>
      ) : (
        <section className="from-primary/10 via-background to-background border-border/60 overflow-hidden rounded-3xl border bg-linear-to-br p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <CategoryPill
                label={cat.name}
                imageUrl={cat.imageUrl}
                active
                className="mb-3"
              />
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {cat.name}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
                Discover top picks, compare items quickly, and open any product
                page to see live vendor availability and pricing nearby.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
              <div className="bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur-sm">
                <p className="text-muted-foreground text-xs">Catalog size</p>
                <p className="text-lg font-semibold tabular-nums">
                  {cat._count.products}
                </p>
              </div>
              <div className="bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur-sm">
                <p className="text-muted-foreground text-xs">Collection</p>
                <p className="text-sm font-semibold">Category spotlight</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {productsQuery.isLoading ? (
        <ProductGridSkeleton count={6} />
      ) : productsQuery.isError ? (
        <p className="text-destructive text-sm">Could not load products.</p>
      ) : items.length === 0 ? (
        <ProductGridEmptyState
          icon={PackageSearch}
          title="No products in this category yet"
          description="We couldn't find anything live in this collection right now."
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Products in {cat?.name ?? 'this category'}
              </h2>
              <p className="text-muted-foreground text-sm">
                Browse the full set and open any item for vendor offers.
              </p>
            </div>
            <div className="text-muted-foreground hidden items-center gap-2 text-sm sm:flex">
              <Grid2x2 className="size-4" />
              {items.length} shown
            </div>
          </div>

          <ProductGrid>
            {items.map((p) => (
              <ProductCard
                key={p.id}
                to={productPath(p.product.id)}
                favoriteProductId={p.product.id}
                name={p.product.name}
                imageUrl={p.imageUrl ?? p.product.imageUrl}
                description={p.product.description}
                categoryName={p.product.category?.name}
                unit={
                  p.variant ? `${p.variant.weight}${p.variant.unit}` : p.product.unit
                }
                vendorName={p.vendor.name}
                price={p.price}
                mrp={p.mrp}
                eyebrow="Live offer"
                badges={!p.vendor.isOpen ? ['Vendor closed'] : []}
              />
            ))}
          </ProductGrid>
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
