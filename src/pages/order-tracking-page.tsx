import { useQuery } from '@tanstack/react-query'
import L from 'leaflet'
import { Loader2Icon, MapPin } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { orderPath } from '@/constants/routes'
import * as deliveryApi from '@/services/delivery.service'
import type { DeliveryDetailDto, RiderLocationDto } from '@/types/delivery'
import { cn } from '@/lib/utils'

import 'leaflet/dist/leaflet.css'

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
  const wrapRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || mapRef.current) return
    const map = L.map(el, { zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    const group = L.layerGroup().addTo(map)
    mapRef.current = map
    layerRef.current = group
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const group = layerRef.current
    if (!map || !group) return

    group.clearLayers()
    const bounds: L.LatLngTuple[] = []

    const v = delivery.order.vendor
    const vendorLL: L.LatLngTuple = [v.latitude, v.longitude]
    L.circleMarker(vendorLL, {
      radius: 7,
      color: '#c2410c',
      fillColor: '#fb923c',
      fillOpacity: 0.9,
      weight: 2,
    })
      .bindTooltip('Restaurant')
      .addTo(group)
    bounds.push(vendorLL)

    const addr = delivery.order.deliveryAddress
    if (addr) {
      const drop: L.LatLngTuple = [addr.latitude, addr.longitude]
      L.circleMarker(drop, {
        radius: 7,
        color: '#15803d',
        fillColor: '#4ade80',
        fillOpacity: 0.9,
        weight: 2,
      })
        .bindTooltip('Delivery address')
        .addTo(group)
      bounds.push(drop)
    }

    if (riderLoc) {
      const r: L.LatLngTuple = [riderLoc.lat, riderLoc.lng]
      L.circleMarker(r, {
        radius: 9,
        color: '#1d4ed8',
        fillColor: '#60a5fa',
        fillOpacity: 0.95,
        weight: 2,
      })
        .bindTooltip(`Rider · ${delivery.rider.user.name}`)
        .addTo(group)
      bounds.push(r)
    }

    if (bounds.length >= 2) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [28, 28], maxZoom: 15 })
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14)
    }
  }, [delivery, riderLoc])

  return (
    <div
      ref={wrapRef}
      className="border-border/80 z-0 h-[min(52vh,420px)] w-full overflow-hidden rounded-xl border"
    />
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
