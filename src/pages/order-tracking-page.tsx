import { useQuery } from '@tanstack/react-query'
import { APIProvider, Map, Marker, Polyline } from '@vis.gl/react-google-maps'
import { Loader2Icon, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { orderPath } from '@/constants/routes'
import * as deliveryApi from '@/services/delivery.service'
import * as mapsApi from '@/services/maps.service'
import type { DeliveryDetailDto, RiderLocationDto } from '@/types/delivery'
import { cn } from '@/lib/utils'

function isActiveTrackingStatus(status: string) {
  return (
    status === 'ASSIGNED' ||
    status === 'REACHED_VENDOR' ||
    status === 'PICKED_UP' ||
    status === 'OUT_FOR_DELIVERY'
  )
}

function TrackingMap({
  delivery,
  riderLoc,
}: {
  delivery: DeliveryDetailDto
  riderLoc: RiderLocationDto | null | undefined
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  const v = delivery.order.vendor
  const addr = delivery.order.deliveryAddress

  const routeQuery = useQuery({
    queryKey: queryKeys.maps.drivingRoute(
      delivery.id,
      riderLoc?.lat,
      riderLoc?.lng,
      addr?.latitude,
      addr?.longitude,
    ),
    queryFn: () =>
      mapsApi.fetchDrivingRoute({
        originLat: riderLoc!.lat,
        originLng: riderLoc!.lng,
        destLat: addr!.latitude,
        destLng: addr!.longitude,
      }),
    enabled: Boolean(
      apiKey?.trim() &&
        riderLoc &&
        addr &&
        isActiveTrackingStatus(delivery.status),
    ),
    retry: false,
    staleTime: 90_000,
  })

  const boundsFromPoints = (): {
    north: number
    south: number
    east: number
    west: number
  } | null => {
    const pts: { lat: number; lng: number }[] = [
      { lat: v.latitude, lng: v.longitude },
    ]
    if (addr) {
      pts.push({ lat: addr.latitude, lng: addr.longitude })
    }
    if (riderLoc) {
      pts.push({ lat: riderLoc.lat, lng: riderLoc.lng })
    }
    if (pts.length === 0) return null
    let north = pts[0].lat
    let south = pts[0].lat
    let east = pts[0].lng
    let west = pts[0].lng
    for (const p of pts) {
      north = Math.max(north, p.lat)
      south = Math.min(south, p.lat)
      east = Math.max(east, p.lng)
      west = Math.min(west, p.lng)
    }
    return { north, south, east, west }
  }

  const defaultBounds = boundsFromPoints()

  if (!apiKey?.trim()) {
    return (
      <div className="border-border/80 text-muted-foreground rounded-xl border border-dashed p-4 text-center text-sm">
        Set <code className="text-foreground">VITE_GOOGLE_MAPS_API_KEY</code> to show the live map.
      </div>
    )
  }

  const encoded =
    routeQuery.data?.encodedPolyline && routeQuery.isSuccess
      ? routeQuery.data.encodedPolyline
      : undefined

  return (
    <APIProvider apiKey={apiKey} region="in" language="en">
      <div className="border-border/80 z-0 h-[min(52vh,420px)] w-full overflow-hidden rounded-xl border">
        <Map
          key={riderLoc ? 'with-rider' : 'no-rider'}
          defaultBounds={defaultBounds ?? undefined}
          defaultCenter={
            defaultBounds
              ? undefined
              : { lat: v.latitude, lng: v.longitude }
          }
          defaultZoom={defaultBounds ? undefined : 14}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
        >
          {encoded ? (
            <Polyline
              encodedPath={encoded}
              strokeColor="#2563eb"
              strokeOpacity={0.9}
              strokeWeight={4}
            />
          ) : null}

          <Marker
            position={{ lat: v.latitude, lng: v.longitude }}
            title={v.name}
          />

          {addr ? (
            <Marker
              position={{ lat: addr.latitude, lng: addr.longitude }}
              title="Delivery address"
            />
          ) : null}

          {riderLoc ? (
            <Marker
              position={{ lat: riderLoc.lat, lng: riderLoc.lng }}
              title={`Rider · ${delivery.rider.user.name}`}
            />
          ) : null}
        </Map>
      </div>
      {routeQuery.isError ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Route line unavailable (check server{' '}
          <code className="text-foreground">GOOGLE_MAPS_SERVER_API_KEY</code>).
        </p>
      ) : null}
    </APIProvider>
  )
}

export function OrderTrackingPage() {
  const { id = '' } = useParams<{ id: string }>()
  const deliveryQuery = useQuery({
    queryKey: queryKeys.delivery.forOrder(id),
    queryFn: () => deliveryApi.fetchDeliveryForOrder(id),
    enabled: Boolean(id),
  })

  const delivery = deliveryQuery.data
  const pollRider = Boolean(
    delivery && isActiveTrackingStatus(delivery.status),
  )

  const riderLocQuery = useQuery({
    queryKey: queryKeys.delivery.riderLocation(delivery?.riderId ?? '_'),
    queryFn: () => deliveryApi.fetchRiderLocation(delivery!.riderId),
    enabled: Boolean(id && delivery && pollRider),
    refetchInterval: pollRider ? 10_000 : false,
  })

  if (!id) {
    return (
      <p className="text-muted-foreground text-sm">Invalid order link.</p>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Live tracking</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Map updates when location data is available. Rider position refreshes
          about every 10 seconds while the delivery is active.
        </p>
      </div>

      {deliveryQuery.isLoading ? (
        <Skeleton className="h-[min(52vh,420px)] w-full rounded-xl" />
      ) : deliveryQuery.isError || !delivery ? (
        <div className="border-border/60 rounded-xl border border-dashed p-6 text-center">
          <MapPin className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">
            No delivery is assigned to this order yet, or tracking is not
            available.
          </p>
          <Link
            to={orderPath(id)}
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 inline-flex')}
          >
            Back to order
          </Link>
        </div>
      ) : (
        <>
          <section className="border-border/80 bg-card rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground text-xs font-medium">
              Rider
            </p>
            <p className="mt-0.5 font-semibold">{delivery.rider.user.name}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {delivery.rider.user.phone}
            </p>
            <p className="text-muted-foreground mt-3 text-xs font-medium">
              Delivery status
            </p>
            <p className="mt-0.5 font-medium">
              {delivery.status.replaceAll('_', ' ')}
            </p>
            {pollRider && (
              <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                {riderLocQuery.isFetching && (
                  <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                )}
                {riderLocQuery.data
                  ? 'Rider location received'
                  : 'Waiting for rider GPS…'}
              </p>
            )}
          </section>

          <TrackingMap
            key={id}
            delivery={delivery}
            riderLoc={pollRider ? riderLocQuery.data : null}
          />
        </>
      )}
    </div>
  )
}
