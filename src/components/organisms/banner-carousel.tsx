import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { BannerDto } from '@/types/discovery'
import { productPath, vendorPath } from '@/constants/routes'

type BannerCarouselProps = {
  banners: BannerDto[]
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [i, setI] = useState(0)
  const navigate = useNavigate()

  const go = useCallback(
    (next: number) => {
      if (!banners.length) return
      setI((next + banners.length) % banners.length)
    },
    [banners.length],
  )

  useEffect(() => {
    if (banners.length <= 1) return
    const t = window.setInterval(() => {
      setI((prev) => (prev + 1) % banners.length)
    }, 4000)
    return () => window.clearInterval(t)
  }, [banners.length])

  const onBannerClick = (b: BannerDto) => {
    if (b.linkType === 'VENDOR' && b.linkId) {
      navigate(vendorPath(b.linkId))
      return
    }
    if (b.linkType === 'PRODUCT' && b.linkId) {
      navigate(productPath(b.linkId))
      return
    }
    if (b.linkType === 'EXTERNAL' && b.externalUrl) {
      window.open(b.externalUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (!banners.length) return null

  const b = banners[i]

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={() => onBannerClick(b)}
        className="relative aspect-[16/6] w-full md:aspect-[16/5]"
      >
        <img
          src={b.imageUrl}
          alt={b.title}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute bottom-3 left-3 text-left text-lg font-medium text-white drop-shadow-md sm:text-xl">
          {b.title}
        </span>
      </button>
      {banners.length > 1 && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute start-2 top-1/2 z-10 size-8 -translate-y-1/2 rounded-full opacity-80"
            onClick={() => go(i - 1)}
            aria-label="Previous banner"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute end-2 top-1/2 z-10 size-8 -translate-y-1/2 rounded-full opacity-80"
            onClick={() => go(i + 1)}
            aria-label="Next banner"
          >
            <ChevronRight className="size-4" />
          </Button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={banners[idx].id}
                type="button"
                onClick={() => setI(idx)}
                className={`size-2 rounded-full transition-colors ${
                  idx === i ? 'bg-primary' : 'bg-white/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
