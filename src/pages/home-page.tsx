import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Truck,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ProductCard } from '@/components/molecules/product-card'
import { VendorCard } from '@/components/molecules/vendor-card'
import { BannerCarousel } from '@/components/organisms/banner-carousel'
import { LocationPickerDialog } from '@/components/organisms/location-picker-dialog'
import { ProductGrid, ProductGridSkeleton } from '@/components/organisms/product-grid'
import { SiteFooter } from '@/components/organisms/site-footer'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { categoryPath, productPath, ROUTES } from '@/constants/routes'
import { useToggleFavorite } from '@/hooks/use-toggle-favorite'
import { cn } from '@/lib/utils'
import { fetchDiscoveryProducts, fetchHomeScreen } from '@/services/discovery.service'
import { fetchNearbyVendors } from '@/services/vendors.service'
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth-store'
import { useLocationStore } from '@/stores/location-store'

const desktopHighlights = [
  {
    title: 'Fresh picks daily',
    description: 'Chicken, mutton, seafood, eggs, and marinades from active local vendors.',
    icon: ShieldCheck,
  },
  {
    title: 'Fast neighborhood delivery',
    description: 'See stores around your selected area and compare prep times instantly.',
    icon: Truck,
  },
  {
    title: 'Clear checkout totals',
    description: 'Delivery, platform fee, and taxes are surfaced before you place the order.',
    icon: ShoppingBag,
  },
] as const

export function HomePage() {
  const navigate = useNavigate()
  const authed = useAuthStore(selectIsAuthenticated)
  const { city, displayLabel, latitude, longitude } = useLocationStore()
  const [locOpen, setLocOpen] = useState(false)
  const [desktopSearch, setDesktopSearch] = useState('')
  const fav = useToggleFavorite()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const locationLabel = displayLabel || city

  const homeQuery = useQuery({
    queryKey: queryKeys.discovery.home(city, latitude, longitude),
    queryFn: () => fetchHomeScreen({ city, latitude, longitude }),
  })

  const featuredProductsQuery = useQuery({
    queryKey: queryKeys.discovery.products(city, undefined, 'home-featured'),
    queryFn: () =>
      fetchDiscoveryProducts({
        city,
        limit: 8,
      }),
  })

  const nearbyQuery = useInfiniteQuery({
    queryKey: queryKeys.vendors.nearby(city, latitude, longitude),
    queryFn: ({ pageParam }) =>
      fetchNearbyVendors({
        city,
        latitude,
        longitude,
        page: pageParam,
        limit: 20,
        radiusKm: 8,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })

  const vendors = useMemo(() => {
    const flat = nearbyQuery.data?.pages.flatMap((p) => p.items) ?? []
    const map = new Map<string, (typeof flat)[number]>()
    for (const vendor of flat) {
      if (!map.has(vendor.id)) map.set(vendor.id, vendor)
    }
    return [...map.values()]
  }, [nearbyQuery.data])

  const featuredProducts = featuredProductsQuery.data?.items ?? []
  const desktopCategories = homeQuery.data?.categories.slice(0, 8) ?? []

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !nearbyQuery.hasNextPage || nearbyQuery.isFetchingNextPage) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void nearbyQuery.fetchNextPage()
        }
      },
      { rootMargin: '120px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [nearbyQuery, vendors.length])

  const handleVendorFavorite = (vendorId: string) => {
    if (!authed) {
      navigate(ROUTES.login, {
        state: {
          from: `${window.location.pathname}${window.location.search}`,
        },
      })
      return
    }
    fav.mutate({ type: 'VENDOR', referenceId: vendorId })
  }

  const runDesktopSearch = () => {
    const q = desktopSearch.trim()
    navigate(q ? `${ROUTES.search}?q=${encodeURIComponent(q)}` : ROUTES.search)
  }

  return (
    <div className="space-y-8 pb-6 lg:space-y-12 lg:pb-12">
      <LocationPickerDialog open={locOpen} onOpenChange={setLocOpen} />

      <div className="lg:hidden space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setLocOpen(true)}
            className="border-border/80 bg-card/60 hover:bg-muted/60 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
          >
            <MapPin className="text-primary size-4 shrink-0" aria-hidden />
            <span className="truncate">{locationLabel}</span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={ROUTES.browse}
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
            >
              All products
            </Link>
            <Link
              to={ROUTES.search}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Search
            </Link>
          </div>
        </div>

        {homeQuery.isLoading ? (
          <Skeleton className="aspect-16/6 w-full rounded-xl md:aspect-16/5" />
        ) : homeQuery.data?.banners.length ? (
          <BannerCarousel banners={homeQuery.data.banners} />
        ) : null}

        {homeQuery.data?.categories.length ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-tight">Categories</h2>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {homeQuery.data.categories.map((category) => (
                <Link
                  key={category.id}
                  to={categoryPath(category.id)}
                  className="border-border/80 bg-card hover:border-primary/40 flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl border p-2 text-center transition-colors"
                >
                  <div className="bg-muted size-8 overflow-hidden rounded-full">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground flex size-full items-center justify-center text-xs">
                        {category.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <span className="line-clamp-2 text-[11px] leading-tight font-medium">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {homeQuery.data?.topVendors?.length ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-tight">Top rated near you</h2>
            <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {homeQuery.data.topVendors.map((vendor) => (
                <div key={vendor.id} className="w-[260px] shrink-0 sm:w-[280px]">
                  <VendorCard
                    id={vendor.id}
                    name={vendor.name}
                    logoUrl={vendor.logoUrl}
                    bannerUrl={vendor.bannerUrl}
                    rating={vendor.rating}
                    totalRatings={vendor.totalRatings}
                    prepTime={vendor.prepTime}
                    distanceKm={vendor.distanceKm}
                    isOpen={vendor.isOpen}
                    isFavorite={vendor.isFavorite}
                    onFavoriteClick={() => handleVendorFavorite(vendor.id)}
                    favoriteLoading={fav.isPending}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Vendors near you</h2>
            <span className="text-muted-foreground text-xs">{locationLabel}</span>
          </div>

          {nearbyQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-52 rounded-xl" />
              ))}
            </div>
          ) : vendors.length === 0 ? (
            <div className="border-border/60 text-muted-foreground rounded-xl border border-dashed px-4 py-12 text-center text-sm">
              No vendors open near you right now. Try another area or check back later.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {vendors.slice(0, 6).map((vendor) => (
                  <VendorCard
                    key={vendor.id}
                    id={vendor.id}
                    name={vendor.name}
                    logoUrl={vendor.logoUrl}
                    bannerUrl={vendor.bannerUrl}
                    rating={vendor.rating}
                    totalRatings={vendor.totalRatings}
                    prepTime={vendor.prepTime}
                    distanceKm={vendor.distanceKm}
                    isOpen={vendor.isOpen}
                    isFavorite={false}
                    onFavoriteClick={() => handleVendorFavorite(vendor.id)}
                    favoriteLoading={fav.isPending}
                  />
                ))}
              </div>
              <div ref={loadMoreRef} className="h-8" />
              {nearbyQuery.isFetchingNextPage && (
                <p className="text-muted-foreground py-4 text-center text-xs">
                  Loading more…
                </p>
              )}
            </>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">
                Popular in {locationLabel}
              </h2>
              <p className="text-muted-foreground text-xs">
                Live product offers from active vendors in your area.
              </p>
            </div>
            <Link
              to={ROUTES.browse}
              className="text-primary text-xs font-semibold"
            >
              View all
            </Link>
          </div>

          {featuredProductsQuery.isLoading ? (
            <ProductGridSkeleton count={4} className="sm:grid-cols-2" />
          ) : (
            <ProductGrid className="sm:grid-cols-2">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  to={productPath(product.product.id)}
                  name={product.product.name}
                  imageUrl={product.imageUrl ?? product.product.imageUrl}
                  description={product.product.description}
                  categoryName={product.product.category?.name}
                  unit={
                    product.variant
                      ? `${product.variant.weight}${product.variant.unit}`
                      : product.product.unit
                  }
                  vendorName={product.vendor.name}
                  price={product.price}
                  mrp={product.mrp}
                  eyebrow="Area offer"
                  badges={!product.vendor.isOpen ? ['Vendor closed'] : []}
                />
              ))}
            </ProductGrid>
          )}
        </section>

        {homeQuery.data?.popularSearches?.length ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-tight">Popular searches</h2>
            <div className="flex flex-wrap gap-2">
              {homeQuery.data.popularSearches.slice(0, 8).map((search) => (
                <Link
                  key={search.query}
                  to={`${ROUTES.search}?q=${encodeURIComponent(search.query)}`}
                  className="bg-muted/80 hover:bg-muted text-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                >
                  {search.query}
                  <ChevronRight className="size-3 opacity-50" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="hidden lg:block space-y-12">
        <section className="overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#f97316_0%,#fb923c_52%,#fdba74_100%)] px-8 py-8 text-white shadow-[0_24px_80px_-32px_rgba(249,115,22,0.75)] xl:px-10 xl:py-10">
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <Store className="size-4" />
                Delivering from trusted local meat stores in {locationLabel}
              </div>
              <div className="max-w-3xl space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight xl:text-5xl">
                  Fresh meat, seafood, eggs, and daily essentials for your area.
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-white/85 xl:text-lg">
                  Browse store banners managed from admin, compare nearby vendors,
                  and order vendor products with a consumer desktop experience
                  designed more like Swiggy and Blinkit.
                </p>
              </div>

              <div className="grid gap-3 xl:grid-cols-[auto_1fr_auto]">
                <button
                  type="button"
                  onClick={() => setLocOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-left text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-white/95"
                >
                  <MapPin className="text-primary size-4 shrink-0" />
                  <span className="truncate">{locationLabel}</span>
                </button>
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                  <Input
                    value={desktopSearch}
                    onChange={(e) => setDesktopSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') runDesktopSearch()
                    }}
                    placeholder="Search for chicken, mutton, seafood, eggs, and more"
                    className="h-12 rounded-2xl border-white/20 bg-white pl-10 text-sm text-zinc-900 placeholder:text-zinc-500"
                  />
                </div>
                <Button
                  type="button"
                  onClick={runDesktopSearch}
                  className="h-12 rounded-2xl bg-zinc-950 px-6 text-white hover:bg-zinc-900"
                >
                  Search
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={ROUTES.browse}
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'lg' }),
                    'rounded-2xl bg-white text-zinc-900 hover:bg-white/95',
                  )}
                >
                  All products
                </Link>
                <Link
                  to={ROUTES.search}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                    'rounded-2xl border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white',
                  )}
                >
                  Explore stores
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {desktopHighlights.map((highlight) => (
                <div
                  key={highlight.title}
                  className="rounded-[1.75rem] bg-white/14 p-5 backdrop-blur-sm"
                >
                  <highlight.icon className="mb-4 size-8 text-white" />
                  <h2 className="text-lg font-semibold tracking-tight">
                    {highlight.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-primary text-sm font-semibold tracking-[0.24em] uppercase">
                  Managed banners
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Campaigns and static storefront cards
                </h2>
              </div>
              <Link
                to={ROUTES.browse}
                className="text-primary inline-flex items-center gap-1 text-sm font-semibold"
              >
                See catalog
                <ArrowRight className="size-4" />
              </Link>
            </div>
            {homeQuery.isLoading ? (
              <Skeleton className="aspect-16/5 w-full rounded-[2rem]" />
            ) : homeQuery.data?.banners.length ? (
              <BannerCarousel banners={homeQuery.data.banners} />
            ) : (
              <div className="from-primary/10 via-primary/5 to-background flex aspect-16/5 items-end rounded-[2rem] border bg-linear-to-br p-8">
                <div>
                  <p className="text-primary text-sm font-semibold uppercase">
                    Fresh delivery
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight">
                    Local stores. Better cuts. Cleaner desktop shopping.
                  </h3>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border bg-card/70 p-6 shadow-sm">
              <Clock3 className="text-primary size-8" />
              <h3 className="mt-4 text-lg font-semibold">Fast prep time visibility</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Desktop now highlights prep times, distance, vendor banners, and
                shopping actions without using the old sidebar layout.
              </p>
            </div>
            <div className="rounded-[2rem] border bg-card/70 p-6 shadow-sm">
              <ShieldCheck className="text-primary size-8" />
              <h3 className="mt-4 text-lg font-semibold">Checkout clarity</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Delivery fee, platform fee, and tax presentation are now aligned
                with the backend validation flow instead of staying hidden.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-primary text-sm font-semibold tracking-[0.24em] uppercase">
                Categories
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Explore by what you want to cook tonight
              </h2>
            </div>
            <Link
              to={ROUTES.browse}
              className="text-primary inline-flex items-center gap-1 text-sm font-semibold"
            >
              Browse everything
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {desktopCategories.map((category) => (
              <Link
                key={category.id}
                to={categoryPath(category.id)}
                className="group rounded-[2rem] border bg-card/70 p-5 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="from-primary/18 via-primary/8 to-background flex aspect-square items-center justify-center overflow-hidden rounded-[1.5rem] bg-linear-to-br">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt=""
                      className="size-24 rounded-full object-cover shadow-sm transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-primary text-4xl font-semibold">
                      {category.name.slice(0, 1)}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {category.name}
                  </h3>
                  <ArrowRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-primary text-sm font-semibold tracking-[0.24em] uppercase">
                Stores around you
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Vendors delivering in {locationLabel}
              </h2>
            </div>
            <Link
              to={ROUTES.search}
              className="text-primary inline-flex items-center gap-1 text-sm font-semibold"
            >
              Search stores
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {nearbyQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-72 rounded-[2rem]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {vendors.slice(0, 6).map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  id={vendor.id}
                  name={vendor.name}
                  logoUrl={vendor.logoUrl}
                  bannerUrl={vendor.bannerUrl}
                  rating={vendor.rating}
                  totalRatings={vendor.totalRatings}
                  prepTime={vendor.prepTime}
                  distanceKm={vendor.distanceKm}
                  isOpen={vendor.isOpen}
                  isFavorite={false}
                  onFavoriteClick={() => handleVendorFavorite(vendor.id)}
                  favoriteLoading={fav.isPending}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-primary text-sm font-semibold tracking-[0.24em] uppercase">
                Live offers
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Vendor products available in your area
              </h2>
            </div>
            <Link
              to={ROUTES.browse}
              className="text-primary inline-flex items-center gap-1 text-sm font-semibold"
            >
              View all products
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {featuredProductsQuery.isLoading ? (
            <ProductGridSkeleton count={8} className="lg:grid-cols-2 xl:grid-cols-4" />
          ) : (
            <ProductGrid className="lg:grid-cols-2 xl:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  to={productPath(product.product.id)}
                  name={product.product.name}
                  imageUrl={product.imageUrl ?? product.product.imageUrl}
                  description={product.product.description}
                  categoryName={product.product.category?.name}
                  unit={
                    product.variant
                      ? `${product.variant.weight}${product.variant.unit}`
                      : product.product.unit
                  }
                  vendorName={product.vendor.name}
                  price={product.price}
                  mrp={product.mrp}
                  favoriteProductId={authed ? product.product.id : undefined}
                  eyebrow="Area offer"
                  badges={!product.vendor.isOpen ? ['Vendor closed'] : []}
                />
              ))}
            </ProductGrid>
          )}
        </section>

        <section
          id="app-download"
          className="overflow-hidden rounded-[2.25rem] bg-zinc-950 px-8 py-8 text-white shadow-[0_28px_90px_-40px_rgba(0,0,0,0.85)]"
        >
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
                <Smartphone className="size-4" />
                Get the app
              </div>
              <h2 className="text-3xl font-semibold tracking-tight xl:text-4xl">
                Keep Chicken Chauk in your pocket for faster repeat orders.
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-zinc-300 xl:text-base">
                Save addresses, revisit your favorite stores, and track every
                order from desktop or mobile with the same account and pricing
                clarity.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/8 px-4 py-3">
                  <p className="text-xs uppercase text-zinc-300">Desktop experience</p>
                  <p className="mt-1 text-lg font-semibold">Centered, storefront layout</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/8 px-4 py-3">
                  <p className="text-xs uppercase text-zinc-300">Checkout clarity</p>
                  <p className="mt-1 text-lg font-semibold">Taxes and fees shown at validation</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] bg-white p-6 text-zinc-950">
                <p className="text-sm font-semibold uppercase text-zinc-500">
                  Order from
                </p>
                <p className="mt-3 text-2xl font-semibold">Nearby stores</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Browse vendor banners, compare prep times, and jump into
                  product detail pages faster.
                </p>
              </div>
              <div className="rounded-[2rem] bg-white/10 p-6">
                <p className="text-sm font-semibold uppercase text-zinc-300">
                  Delivery area
                </p>
                <p className="mt-3 text-2xl font-semibold">{locationLabel}</p>
                <p className="mt-2 text-sm text-zinc-300">
                  Update your location anytime to refresh the stores and offers
                  shown on the desktop home page.
                </p>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter locationLabel={locationLabel} />
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
