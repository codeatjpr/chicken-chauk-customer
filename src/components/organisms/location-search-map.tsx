import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const DEFAULT_CENTER: L.LatLngTuple = [28.6139, 77.209]
const NOMINATIM_MIN_INTERVAL_MS = 1100

const pinIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowAnchor: [12, 41],
  popupAnchor: [1, -34],
})

type NominatimAddress = {
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  state?: string
  state_district?: string
  postcode?: string
  suburb?: string
  neighbourhood?: string
  road?: string
  hamlet?: string
}

type NominatimHit = {
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}

type NominatimReverseHit = {
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}

export type LocationSelection = {
  latitude: number
  longitude: number
  displayName: string
  city?: string
  state?: string
  pincode?: string
  area?: string
}

type LocationSearchMapProps = {
  latitude: number
  longitude: number
  onPick: (selection: LocationSelection) => void
  initialSearchText?: string
  height?: number
  className?: string
  label?: string
  description?: string
}

function parseCoords(lat: number, lng: number): L.LatLngTuple | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return [lat, lng]
}

function extractSelection(
  displayName: string,
  lat: number,
  lng: number,
  address?: NominatimAddress,
): LocationSelection {
  const city =
    address?.city ??
    address?.town ??
    address?.village ??
    address?.municipality ??
    address?.county
  const state = address?.state ?? address?.state_district
  const area =
    address?.suburb ??
    address?.neighbourhood ??
    address?.road ??
    address?.hamlet ??
    city

  return {
    latitude: lat,
    longitude: lng,
    displayName,
    city,
    state,
    pincode: address?.postcode,
    area,
  }
}

async function searchNominatim(query: string): Promise<NominatimHit[]> {
  const q = query.trim()
  if (!q) return []

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '8')
  url.searchParams.set('countrycodes', 'in')
  url.searchParams.set('addressdetails', '1')

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'X-Requested-With': 'ChickenChaukCustomer',
    },
  })
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  const data = (await res.json()) as NominatimHit[]
  return Array.isArray(data) ? data : []
}

async function reverseLookup(lat: number, lng: number): Promise<NominatimReverseHit | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('zoom', '18')
  url.searchParams.set('addressdetails', '1')

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'X-Requested-With': 'ChickenChaukCustomer',
    },
  })
  if (!res.ok) throw new Error(`Reverse lookup failed (${res.status})`)
  const data = (await res.json()) as NominatimReverseHit
  return data?.display_name ? data : null
}

export function LocationSearchMap({
  latitude,
  longitude,
  onPick,
  initialSearchText = '',
  height = 300,
  className,
  label = 'Find location',
  description = 'Search by area, landmark, city, or pincode, use GPS, or adjust the pin on the map.',
}: LocationSearchMapProps) {
  const initialCoordsRef = useRef({ latitude, longitude })
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const lastLookupAt = useRef(0)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  const [mapReady, setMapReady] = useState(false)
  const [searchText, setSearchText] = useState(initialSearchText)
  const [searchHits, setSearchHits] = useState<NominatimHit[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string>('')
  const [selectedMeta, setSelectedMeta] = useState<string>('')
  const [lookupLoading, setLookupLoading] = useState(false)

  const waitForRateLimit = useCallback(async () => {
    const now = Date.now()
    const wait = NOMINATIM_MIN_INTERVAL_MS - (now - lastLookupAt.current)
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait))
    }
    lastLookupAt.current = Date.now()
  }, [])

  const jumpTo = useCallback((lat: number, lng: number, zoom = 16) => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    const ll = L.latLng(lat, lng)
    marker.setLatLng(ll)
    map.setView(ll, zoom)
  }, [])

  const applySelection = useCallback((selection: LocationSelection) => {
    setSelectedLabel(selection.area ?? selection.city ?? selection.displayName)
    setSelectedMeta(
      [selection.city, selection.state, selection.pincode].filter(Boolean).join(', '),
    )
    onPickRef.current(selection)
  }, [])

  const reverseAndApply = useCallback(
    async (lat: number, lng: number) => {
      setLookupLoading(true)
      setSearchError(null)
      try {
        await waitForRateLimit()
        const hit = await reverseLookup(lat, lng)
        const selection = hit
          ? extractSelection(hit.display_name, lat, lng, hit.address)
          : {
              latitude: lat,
              longitude: lng,
              displayName: 'Pinned location',
            }
        applySelection(selection)
      } catch {
        applySelection({
          latitude: lat,
          longitude: lng,
          displayName: 'Pinned location',
        })
      } finally {
        setLookupLoading(false)
      }
    },
    [applySelection, waitForRateLimit],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const parsed = parseCoords(
      initialCoordsRef.current.latitude,
      initialCoordsRef.current.longitude,
    )
    const center = parsed ?? DEFAULT_CENTER
    const zoom = parsed ? 16 : 12

    const map = L.map(el, { scrollWheelZoom: true }).setView(center, zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker(center, { draggable: true, icon: pinIcon }).addTo(map)
    mapRef.current = map
    markerRef.current = marker

    marker.on('dragend', () => {
      const point = marker.getLatLng()
      void reverseAndApply(point.lat, point.lng)
    })

    map.on('click', (event: L.LeafletMouseEvent) => {
      marker.setLatLng(event.latlng)
      map.panTo(event.latlng)
      void reverseAndApply(event.latlng.lat, event.latlng.lng)
    })

    const timeout = window.setTimeout(() => {
      map.invalidateSize()
      setMapReady(true)
    }, 150)

    return () => {
      window.clearTimeout(timeout)
      setMapReady(false)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [reverseAndApply])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return

    const parsed = parseCoords(latitude, longitude)
    if (!parsed) return

    const current = marker.getLatLng()
    if (Math.abs(current.lat - parsed[0]) < 1e-7 && Math.abs(current.lng - parsed[1]) < 1e-7) return

    marker.setLatLng(parsed)
    map.setView(parsed, Math.max(map.getZoom(), 14), { animate: false })
  }, [latitude, longitude])

  useEffect(() => {
    setSearchText(initialSearchText)
  }, [initialSearchText])

  useEffect(() => {
    if (initialSearchText.trim()) {
      setSelectedLabel(initialSearchText)
    }
  }, [initialSearchText])

  async function handleSearch() {
    const query = searchText.trim()
    setSearchError(null)
    setSearchHits([])
    if (!query) {
      setSearchError('Type an area, landmark, city, or 6-digit pincode to search.')
      return
    }
    if (!mapReady) return

    setSearchLoading(true)
    try {
      await waitForRateLimit()
      const hits = await searchNominatim(query)
      if (hits.length === 0) {
        setSearchError('No results found. Try a fuller address or another spelling.')
      } else {
        setSearchHits(hits)
      }
    } catch {
      setSearchError('Could not reach location search right now. Please try again.')
    } finally {
      setSearchLoading(false)
    }
  }

  function pickHit(hit: NominatimHit) {
    const lat = Number.parseFloat(hit.lat)
    const lng = Number.parseFloat(hit.lon)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return

    jumpTo(lat, lng, 17)
    setSearchHits([])
    setSearchError(null)
    applySelection(extractSelection(hit.display_name, lat, lng, hit.address))
  }

  function handleUseMyLocation() {
    setGeoError(null)
    if (!navigator.geolocation) {
      setGeoError('Your browser does not support location access.')
      return
    }
    if (!mapReady) return

    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        jumpTo(lat, lng, 17)
        setGeoLoading(false)
        void reverseAndApply(lat, lng)
      },
      (error) => {
        setGeoLoading(false)
        const message =
          error.code === 1
            ? 'Location permission was denied. Use search or move the pin manually.'
            : error.code === 2
              ? 'Current location is unavailable. Try search instead.'
              : 'Could not fetch your location. Please search or place the pin manually.'
        setGeoError(message)
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-card', className)}>
      <div className="space-y-3 border-b border-border p-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 flex-1 gap-2">
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search area, landmark, city, or pincode"
              className="min-w-0"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handleSearch()
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 gap-1.5"
              disabled={!mapReady || searchLoading}
              onClick={() => void handleSearch()}
            >
              {searchLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Search className="size-4" aria-hidden />
              )}
              Search
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 gap-1.5"
            disabled={!mapReady || geoLoading}
            onClick={handleUseMyLocation}
          >
            {geoLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Crosshair className="size-4" aria-hidden />
            )}
            Use my location
          </Button>
        </div>

        {searchError ? <p className="text-destructive text-xs">{searchError}</p> : null}
        {geoError ? <p className="text-destructive text-xs">{geoError}</p> : null}

        {searchHits.length > 0 ? (
          <ul className="border-input bg-muted/40 max-h-40 overflow-y-auto rounded-lg border text-xs">
            {searchHits.map((hit, index) => (
              <li key={`${hit.lat}-${hit.lon}-${index}`} className="border-border/80 border-b last:border-0">
                <button
                  type="button"
                  className="hover:bg-muted flex w-full items-start gap-2 px-3 py-2 text-left"
                  onClick={() => pickHit(hit)}
                >
                  <MapPin className="text-primary mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span className="line-clamp-2">{hit.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-2">
          <p className="text-foreground text-sm font-medium">
            {lookupLoading ? 'Updating selected spot...' : selectedLabel || 'No spot selected yet'}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {selectedMeta || 'Search, use GPS, or move the pin to fine-tune the delivery location.'}
          </p>
        </div>
      </div>

      <div ref={containerRef} className="bg-muted/30 w-full" style={{ height }} />

      <p className="text-muted-foreground border-t border-border bg-card px-3 py-2 text-xs leading-relaxed">
        Map data © OpenStreetMap contributors. Search uses{' '}
        <a
          href="https://nominatim.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Nominatim
        </a>
        . You can click the map or drag the pin if the spot needs adjustment.
      </p>
    </div>
  )
}
