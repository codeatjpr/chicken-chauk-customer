import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Search, ShoppingBag, Star, Timer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CartLineControls } from '@/components/molecules/cart-line-controls'
import { CartPanel } from '@/components/organisms/cart-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { ROUTES } from '@/constants/routes'
import { useDebounceValue } from '@/hooks/use-debounce-value'
import { useVendorCartActions } from '@/hooks/use-vendor-cart-actions'
import { fetchVendorProducts } from '@/services/catalog.service'
import * as ratingsApi from '@/services/ratings.service'
import { fetchVendorById } from '@/services/vendors.service'
import { formatInr } from '@/utils/format'
import type { VendorProductDto } from '@/types/catalog'
import { cn } from '@/lib/utils'

type CategoryTab = { id: string; name: string }

function groupByCategory(items: VendorProductDto[]) {
  const map = new Map<string, { name: string; items: VendorProductDto[] }>()
  for (const row of items) {
    const cid = row.product.category?.id ?? '_uncat'
    const cname = row.product.category?.name ?? 'Other'
    if (!map.has(cid)) map.set(cid, { name: cname, items: [] })
    map.get(cid)!.items.push(row)
  }
  return [...map.entries()].map(([id, v]) => ({ id, ...v }))
}

export function VendorPage() {
  const { id: vendorId = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeCat, setActiveCat] = useState<string>('all')
  const [menuFilter, setMenuFilter] = useState('')

  const vendorQuery = useQuery({
    queryKey: queryKeys.vendors.detail(vendorId),
    queryFn: () => fetchVendorById(vendorId),
    enabled: Boolean(vendorId),
  })

  const debouncedMenuSearch = useDebounceValue(menuFilter, 350)
  const categoryFilter = activeCat === 'all' ? undefined : activeCat
  const searchParam =
    debouncedMenuSearch.trim().length > 0
      ? debouncedMenuSearch.trim()
      : undefined

  const menuBaselineQuery = useQuery({
    queryKey: queryKeys.catalog.vendorProducts(vendorId, undefined, undefined),
    queryFn: () => fetchVendorProducts(vendorId, { limit: 200 }),
    enabled: Boolean(vendorId),
  })

  const menuDisplayQuery = useQuery({
    queryKey: queryKeys.catalog.vendorProducts(
      vendorId,
      categoryFilter,
      searchParam,
    ),
    queryFn: () =>
      fetchVendorProducts(vendorId, {
        categoryId: categoryFilter,
        search: searchParam,
        limit: 100,
      }),
    enabled: Boolean(vendorId),
  })

  const ratingSummaryQuery = useQuery({
    queryKey: queryKeys.ratings.vendorSummary(vendorId),
    queryFn: () => ratingsApi.fetchVendorRatingSummary(vendorId),
    enabled: Boolean(vendorId),
    staleTime: 60_000,
  })

  const {
    cart,
    addWithSwitch,
    switchOpen,
    setSwitchOpen,
    confirmVendorSwitch,
    addIsPending,
    updateIsPending,
    updateQty,
    removeLine,
  } = useVendorCartActions()

  const categories: CategoryTab[] = useMemo(() => {
    const items = menuBaselineQuery.data?.items ?? []
    const g = groupByCategory(items)
    return g.map(({ id, name }) => ({ id, name }))
  }, [menuBaselineQuery.data])

  const displayItems = menuDisplayQuery.data?.items ?? []

  const vendor = vendorQuery.data
  const showSticky =
    cart && cart.items.length > 0 && cart.vendorId === vendorId

  if (!vendorId) {
    return (
      <p className="text-muted-foreground text-sm">Invalid vendor link.</p>
    )
  }

  return (
    <div
      className={cn(
        'pb-6',
        showSticky && 'pb-28 lg:pb-6',
      )}
    >
      <div className="mb-4 flex items-center gap-2">
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

      {vendorQuery.isLoading ? (
        <Skeleton className="mb-6 h-40 rounded-xl" />
      ) : vendorQuery.isError || !vendor ? (
        <p className="text-destructive text-sm">Could not load this vendor.</p>
      ) : (
        <header className="mb-6 overflow-hidden rounded-xl border shadow-sm">
          <div className="bg-muted relative aspect-[16/7] w-full">
            {vendor.bannerUrl ? (
              <img
                src={vendor.bannerUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center text-4xl font-semibold">
                {vendor.name.slice(0, 1)}
              </div>
            )}
            {!vendor.isOpen && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold tracking-wide text-white uppercase">
                Closed now
              </div>
            )}
          </div>
          <div className="p-4">
            <h1 className="text-xl font-semibold tracking-tight">
              {vendor.name}
            </h1>
            {vendor.description && (
              <p className="text-muted-foreground mt-1 text-sm">
                {vendor.description}
              </p>
            )}
            <div className="text-muted-foreground mt-3 flex flex-wrap gap-3 text-xs">
              <span className="inline-flex items-center gap-1">
                <Star
                  className="size-3.5 fill-amber-500 text-amber-500"
                  aria-hidden
                />
                {vendor.rating.toFixed(1)} ({vendor.totalRatings})
              </span>
              {vendor.prepTime != null && (
                <span className="inline-flex items-center gap-1">
                  <Timer className="size-3.5" aria-hidden />
                  {vendor.prepTime} min prep
                </span>
              )}
              <span>{vendor.city}</span>
            </div>
            {ratingSummaryQuery.data &&
              ratingSummaryQuery.data.totalRatings > 0 && (
                <p className="text-muted-foreground mt-2 text-xs">
                  {ratingSummaryQuery.data.totalRatings} verified reviews
                  {ratingSummaryQuery.data.averageProductQuality != null && (
                    <>
                      {' '}
                      · Food quality avg{' '}
                      {ratingSummaryQuery.data.averageProductQuality.toFixed(1)}
                      /5
                    </>
                  )}
                </p>
              )}
          </div>
        </header>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
        <div className="min-w-0">
          {menuBaselineQuery.isLoading || menuDisplayQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : menuDisplayQuery.isError ? (
            <p className="text-destructive text-sm">Menu could not be loaded.</p>
          ) : (
            <>
              <div className="relative mb-3">
                <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  className="ps-9"
                  placeholder="Filter dishes in this menu…"
                  value={menuFilter}
                  onChange={(e) => setMenuFilter(e.target.value)}
                  aria-label="Filter menu"
                />
              </div>
              <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
                <button
                  type="button"
                  onClick={() => setActiveCat('all')}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    activeCat === 'all'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/80 bg-card hover:bg-muted/60',
                  )}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCat(c.id)}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      activeCat === c.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/80 bg-card hover:bg-muted/60',
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <ul className="space-y-3">
                {displayItems.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    No dishes match your filter.
                  </p>
                ) : null}
                {displayItems.map((row) => (
                  <li
                    key={row.id}
                    className="border-border/80 bg-card flex gap-3 rounded-xl border p-3"
                  >
                    <div className="bg-muted size-20 shrink-0 overflow-hidden rounded-lg">
                      {row.product.imageUrl ? (
                        <img
                          src={row.product.imageUrl}
                          alt=""
                          width={160}
                          height={160}
                          loading="lazy"
                          decoding="async"
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground flex size-full items-center justify-center text-lg font-medium">
                          {row.product.name.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{row.product.name}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {row.product.unit}
                        {row.mrp != null && row.mrp > row.price && (
                          <span className="ms-2 line-through">
                            {formatInr(row.mrp)}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 font-semibold tabular-nums">
                        {formatInr(row.price)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-center">
                      <CartLineControls
                        cart={cart}
                        vendorProductId={row.id}
                        maxQty={Math.max(0, row.stock)}
                        isAvailable={row.isAvailable && vendor?.isOpen === true}
                        isAdding={addIsPending}
                        isUpdating={updateIsPending}
                        onAdd={(qty) =>
                          addWithSwitch(vendorId, row.id, qty)
                        }
                        onUpdateQty={updateQty}
                        onRemove={removeLine}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="border-border/60 mt-8 hidden lg:sticky lg:top-20 lg:mt-0 lg:block lg:max-h-[calc(100vh-6rem)] lg:rounded-xl lg:border lg:p-4">
          <h2 className="mb-2 text-sm font-semibold">Cart</h2>
          <ScrollArea className="max-h-[min(70vh,520px)]">
            <CartPanel cart={cart} isLoading={false} />
          </ScrollArea>
        </aside>
      </div>

      {showSticky && (
        <div className="border-border/80 bg-background/95 fixed inset-x-0 bottom-16 z-20 flex items-center justify-between gap-3 border-t px-3 py-3 backdrop-blur-md lg:hidden">
          <div className="min-w-0">
            <p className="text-muted-foreground truncate text-xs">
              {cart.vendorName}
            </p>
            <p className="font-semibold tabular-nums">
              {formatInr(cart.estimatedTotal)}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setSheetOpen(true)}
          >
            <ShoppingBag className="size-4" />
            Cart
          </Button>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader>
            <SheetTitle>Your cart</SheetTitle>
          </SheetHeader>
          <ScrollArea className="max-h-[65vh] pe-2">
            <CartPanel cart={cart} />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Your cart has items from another vendor. Adding from this menu
              will clear the current cart and start fresh here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmVendorSwitch()}>
              Clear and continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
