import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, Smartphone, Store, Truck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { brandLogo } from "@/constants/brand-assets";
import { HeroCarousel } from "@/components/organisms/hero-carousel";
import { heroCarouselAspectClass } from "@/lib/hero-asset";
import { LocationPickerDialog } from "@/components/organisms/location-picker-dialog";
import { ProductCard } from "@/components/molecules/product-card";
import { VendorCard } from "@/components/molecules/vendor-card";
import { ProductGrid } from "@/components/organisms/product-grid";
import { SiteFooter } from "@/components/organisms/site-footer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/constants/query-keys";
import { categoryPath, productPath, ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { fetchDiscoveryProducts, fetchHomeScreen } from "@/services/discovery.service";
import { fetchNearbyVendors } from "@/services/vendors.service";
import { useLocationStore } from "@/stores/location-store";
import { NO_SHOPS_NEARBY_DESCRIPTION, NO_SHOPS_NEARBY_TITLE } from "@/lib/nearby-shops-copy";

export function LandingPage() {
  const navigate = useNavigate();
  const { city, displayLabel, latitude, longitude } = useLocationStore();
  const [locOpen, setLocOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const locationLabel = displayLabel || city;

  const homeQuery = useQuery({
    queryKey: queryKeys.discovery.home(city, latitude, longitude),
    queryFn: () => fetchHomeScreen({ city, latitude, longitude }),
  });
  const heroSlides = homeQuery.data?.heroCarousel ?? [];

  const productsQuery = useQuery({
    queryKey: queryKeys.discovery.products(city, latitude, longitude, undefined, undefined, "landing"),
    queryFn: () =>
      fetchDiscoveryProducts({
        city,
        latitude,
        longitude,
        limit: 4,
      }),
  });

  const nearbyQuery = useQuery({
    queryKey: [...queryKeys.vendors.nearby(city, latitude, longitude), "landing"],
    queryFn: () =>
      fetchNearbyVendors({
        latitude,
        longitude,
        page: 1,
        limit: 3,
      }),
  });

  const runSearch = () => {
    const q = searchInput.trim();
    navigate(q ? `${ROUTES.search}?q=${encodeURIComponent(q)}` : ROUTES.search);
  };

  return (
    <div className="bg-background min-h-svh">
      <LocationPickerDialog open={locOpen} onOpenChange={setLocOpen} />

      <header className="sticky top-0 z-20 border-b border-zinc-200/90 bg-white shadow-[0_4px_24px_-12px_rgba(0,0,0,0.12)]">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-3 px-4 lg:h-20 lg:px-6">
          <Link to={ROUTES.home} className="inline-flex items-center">
            <img
              src={brandLogo}
              alt="ChickenChauk"
              className="h-11 w-auto max-w-[240px] object-contain sm:h-12 lg:h-[3.25rem]"
            />
          </Link>
          <div className="flex items-center gap-2">
            <a
              href="#app-download"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden lg:inline-flex")}>
              Get the app
            </a>
            <Link to={ROUTES.login} className={cn(buttonVariants({ size: "sm" }))}>
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main id="marketing-main" className="mx-auto w-full max-w-[1280px] px-4 py-6 lg:px-6 lg:py-10">
        <div className="space-y-8 lg:hidden">
          <div className="space-y-4 rounded-[2rem] border bg-card/70 p-5 text-center shadow-sm">
            <img
              src={brandLogo}
              alt="ChickenChauk"
              className="mx-auto h-20 w-auto max-w-[280px] object-contain sm:h-[5.25rem]"
            />
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Fresh meat delivered from trusted local stores</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Explore categories, compare stores, and sign in when you are ready to order.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button type="button" variant="outline" onClick={() => setLocOpen(true)}>
                <MapPin className="size-4" />
                {locationLabel}
              </Button>
              <Link to={ROUTES.search} className={cn(buttonVariants({ size: "lg" }))}>
                Start browsing
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden lg:block space-y-12">
          <section className="overflow-hidden rounded-[2.25rem] bg-[linear-gradient(135deg,#f97316_0%,#fb923c_55%,#fdba74_100%)] px-8 py-10 text-white shadow-[0_24px_80px_-32px_rgba(249,115,22,0.78)]">
            <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                  <Store className="size-4" />
                  Delivery marketplace for {locationLabel}
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-5xl font-semibold tracking-tight">
                    Order fresh cuts, seafood, and essentials from stores around you.
                  </h1>
                  <p className="max-w-2xl text-lg leading-relaxed text-white/85">
                    A storefront-style desktop landing page with your branding, center-aligned content, a home hero
                    carousel, strong category discovery, and modern search actions.
                  </p>
                </div>
                <div className="grid gap-3 xl:grid-cols-[auto_1fr_auto]">
                  <button
                    type="button"
                    onClick={() => setLocOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm">
                    <MapPin className="text-primary size-4" />
                    {locationLabel}
                  </button>
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
                    <Input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") runSearch();
                      }}
                      placeholder="Search shops and products by name…"
                      className="h-12 rounded-2xl border-white/15 bg-white pl-10 text-zinc-900"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={runSearch}
                    className="h-12 rounded-2xl bg-zinc-950 px-6 text-white hover:bg-zinc-900">
                    Search
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={ROUTES.search}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "lg" }),
                      "rounded-2xl bg-white text-zinc-900 hover:bg-white/95",
                    )}>
                    Explore products
                  </Link>
                  <Link
                    to={ROUTES.login}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "rounded-2xl border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white",
                    )}>
                    Sign in to order
                  </Link>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[2rem] bg-white/14 p-6 backdrop-blur-sm">
                  <Truck className="mb-4 size-8" />
                  <h2 className="text-xl font-semibold">See stores by your area</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    Update your delivery location and refresh the hero carousel, categories, stores, and offers for that
                    place.
                  </p>
                </div>
                <div className="rounded-[2rem] bg-white/14 p-6 backdrop-blur-sm">
                  <Smartphone className="mb-4 size-8" />
                  <h2 className="text-xl font-semibold">Desktop first, mobile friendly</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    Desktop now feels like a marketplace instead of an admin panel, while mobile keeps the simpler
                    shopping flow.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div>
                <p className="text-primary text-sm font-semibold tracking-[0.24em] uppercase">Home hero carousel</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Campaigns and seasonal highlights</h2>
              </div>
              {homeQuery.isLoading ? (
                <Skeleton className={cn(heroCarouselAspectClass, "w-full rounded-[2rem]")} />
              ) : heroSlides.length ? (
                <HeroCarousel slides={heroSlides} className="rounded-[2rem]" />
              ) : (
                <div
                  className={cn(
                    "from-primary/12 via-primary/6 to-background flex items-end rounded-[2rem] border bg-linear-to-br p-8",
                    heroCarouselAspectClass,
                  )}>
                  <div>
                    <p className="text-primary text-sm font-semibold uppercase">Chicken Chauk</p>
                    <h3 className="mt-2 text-3xl font-semibold tracking-tight">
                      Hero slides from the admin panel appear here for your selected location.
                    </h3>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-primary text-sm font-semibold uppercase">Categories</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
                {homeQuery.data?.categories.slice(0, 4).map((category) => (
                  <Link
                    key={category.id}
                    to={categoryPath(category.id)}
                    className="group flex flex-col items-center gap-3 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <div className="bg-muted relative mx-auto aspect-square w-full max-w-30 overflow-hidden rounded-full shadow-md ring-2 ring-border/15 transition-[transform,box-shadow] group-hover:scale-[1.03] group-hover:shadow-lg group-hover:ring-border/40 sm:max-w-36">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt=""
                          className="absolute inset-0 size-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-primary flex size-full items-center justify-center text-3xl font-semibold sm:text-4xl">
                          {category.name.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold sm:text-base">{category.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-primary text-sm font-semibold tracking-[0.24em] uppercase">Shops near you</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Shops serving {locationLabel}</h2>
              </div>
              <Link to={ROUTES.login} className="text-primary text-sm font-semibold">
                Sign in to order
              </Link>
            </div>

            {nearbyQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-72 rounded-[2rem]" />
                ))}
              </div>
            ) : (nearbyQuery.data?.items?.length ?? 0) === 0 ? (
              <div className="border-border/60 bg-muted/25 rounded-[2rem] border border-dashed px-6 py-12 text-center">
                <p className="text-foreground text-sm font-semibold">{NO_SHOPS_NEARBY_TITLE}</p>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{NO_SHOPS_NEARBY_DESCRIPTION}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {nearbyQuery.data!.items.map((vendor) => (
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
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-primary text-sm font-semibold tracking-[0.24em] uppercase">Popular products</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Live area products on desktop</h2>
              </div>
              <Link to={ROUTES.search} className="text-primary text-sm font-semibold">
                Search catalog
              </Link>
            </div>

            <ProductGrid className="lg:grid-cols-2 xl:grid-cols-4">
              {productsQuery.data?.items.map((product) => (
                <ProductCard
                  key={product.id}
                  to={productPath(product.product.id)}
                  name={product.product.name}
                  imageUrl={product.imageUrl ?? product.product.imageUrl}
                  description={product.product.description}
                  categoryName={product.product.category?.name}
                  unit={product.quantityUnit ?? ""}
                  vendorName={product.vendor.name}
                  price={product.price}
                  mrp={product.mrp}
                  eyebrow="Guest preview"
                />
              ))}
            </ProductGrid>
          </section>

          <section id="app-download" className="overflow-hidden rounded-[2.25rem] bg-zinc-950 px-8 py-8 text-white">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
                  <Smartphone className="size-4" />
                  Get the app
                </div>
                <h2 className="text-4xl font-semibold tracking-tight">
                  Save your address and order faster once you sign in.
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">
                  Desktop discovery, mobile convenience, and shop-driven product feeds built around your chosen delivery
                  area.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[2rem] bg-white p-6 text-zinc-950">
                  <p className="text-sm font-semibold uppercase text-zinc-500">Area</p>
                  <p className="mt-3 text-2xl font-semibold">{locationLabel}</p>
                  <p className="mt-2 text-sm text-zinc-600">Change your location anytime before you sign in.</p>
                </div>
                <div className="rounded-[2rem] bg-white/10 p-6">
                  <p className="text-sm font-semibold uppercase text-zinc-300">Start now</p>
                  <p className="mt-3 text-2xl font-semibold">Create your first order</p>
                  <p className="mt-2 text-sm text-zinc-300">
                    Browse stores and products first, then sign in only when you are ready.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <SiteFooter locationLabel={locationLabel} />
        </div>
      </main>
    </div>
  );
}
