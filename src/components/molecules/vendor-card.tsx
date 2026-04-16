import { Heart, MapPin, Star, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { formatDistanceKm } from '@/utils/format'
import { vendorPath } from '@/constants/routes'
import { cn } from '@/lib/utils'

type VendorCardProps = {
  id: string
  name: string
  logoUrl: string | null
  bannerUrl?: string | null
  rating: number
  totalRatings: number
  prepTime: number | null
  distanceKm?: number
  isOpen: boolean
  isFavorite?: boolean
  onFavoriteClick?: () => void
  favoriteLoading?: boolean
}

export function VendorCard({
  id,
  name,
  logoUrl,
  bannerUrl,
  rating,
  totalRatings,
  prepTime,
  distanceKm,
  isOpen,
  isFavorite,
  onFavoriteClick,
  favoriteLoading,
}: VendorCardProps) {
  const coverImageUrl = bannerUrl ?? logoUrl

  return (
    <div
      className={cn(
        'border-border/80 bg-card ring-foreground/8 group relative overflow-hidden rounded-xl shadow-sm ring-1 transition-shadow hover:shadow-md lg:hover:ring-foreground/12',
        !isOpen && 'opacity-90',
      )}
    >
      <Link to={vendorPath(id)} className="block">
        <div className="bg-muted relative aspect-16/7 w-full overflow-hidden">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex size-full items-center justify-center text-4xl font-semibold">
              {name.slice(0, 1)}
            </div>
          )}
          {!isOpen && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold tracking-wide text-white uppercase">
              Closed
            </div>
          )}
        </div>
        <div className="relative px-3 pb-3 pt-8">
          <div className="border-background absolute -top-7 left-3 size-12 overflow-hidden rounded-full border-4 bg-white shadow-sm dark:bg-zinc-900">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-muted-foreground flex size-full items-center justify-center text-lg font-medium">
                {name.slice(0, 1)}
              </span>
            )}
          </div>
          <h3 className="line-clamp-1 text-[15px] font-semibold">{name}</h3>
          <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1 text-xs">
            <Star
              className="text-amber-500 size-3.5 shrink-0 fill-amber-500"
              aria-hidden
            />
            <span>{rating.toFixed(1)}</span>
            <span>({totalRatings})</span>
          </div>
          <div className="text-muted-foreground mt-2 flex flex-wrap gap-2 text-xs">
            {prepTime != null && (
              <span className="bg-muted/80 inline-flex items-center gap-1 rounded-full px-2 py-0.5">
                <Timer className="size-3" aria-hidden />
                {prepTime} min prep
              </span>
            )}
            {distanceKm != null && (
              <span className="bg-muted/80 inline-flex items-center gap-1 rounded-full px-2 py-0.5">
                <MapPin className="size-3" aria-hidden />
                {formatDistanceKm(distanceKm)}
              </span>
            )}
          </div>
        </div>
      </Link>
      {onFavoriteClick && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute inset-e-2 top-2 z-10 bg-background/80 hover:bg-background"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          disabled={favoriteLoading}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onFavoriteClick()
          }}
        >
          <Heart
            className={cn(
              'size-4',
              isFavorite && 'fill-primary text-primary',
            )}
          />
        </Button>
      )}
    </div>
  )
}
