import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useMinWidth } from '@/hooks/use-media-query'
import { heroCarouselAspectClass, resolveHeroImage } from '@/lib/hero-asset'
import { cn } from '@/lib/utils'
import type { HeroCarouselSlideDto } from '@/types/discovery'
import { productPath, vendorPath } from '@/constants/routes'

type HeroCarouselProps = {
  slides: HeroCarouselSlideDto[]
  className?: string
}

function HeroSlideImage({ src }: { src: string }) {
  const [imgBroken, setImgBroken] = useState(false)

  return (
    <>
      <img
        src={src}
        alt=""
        onError={() => setImgBroken(true)}
        className={cn('size-full object-cover', imgBroken && 'opacity-0')}
      />
      {imgBroken ? (
        <div
          className="bg-muted text-muted-foreground absolute inset-0 flex items-center justify-center p-4 text-sm"
          aria-hidden
        >
          Image unavailable
        </div>
      ) : null}
    </>
  )
}

/**
 * Static home hero: manual prev/next only (no auto-rotate). Uses separate mobile/desktop assets when set.
 */
export function HeroCarousel({ slides, className }: HeroCarouselProps) {
  const [i, setI] = useState(0)
  const navigate = useNavigate()
  const isMdUp = useMinWidth(768)

  const go = useCallback(
    (next: number) => {
      if (!slides.length) return
      setI((next + slides.length) % slides.length)
    },
    [slides.length],
  )

  const onSlideClick = (s: HeroCarouselSlideDto) => {
    if (s.isClickable === false) return
    if (s.linkType === 'STATIC') return
    if (s.linkType === 'VENDOR' && s.linkId) {
      navigate(vendorPath(s.linkId))
      return
    }
    if (s.linkType === 'PRODUCT' && s.linkId) {
      navigate(productPath(s.linkId))
      return
    }
    if (s.linkType === 'EXTERNAL' && s.externalUrl) {
      window.open(s.externalUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (!slides.length) return null

  const s = slides[i]
  const src = resolveHeroImage(s, isMdUp)
  const clickable = s.isClickable !== false && s.linkType !== 'STATIC'

  return (
    <div className={cn('relative w-full max-w-full overflow-hidden rounded-2xl md:rounded-[2rem]', className)}>
      <button
        type="button"
        onClick={() => onSlideClick(s)}
        className={cn(
          'relative w-full overflow-hidden',
          heroCarouselAspectClass,
          !clickable ? 'cursor-default' : 'cursor-pointer',
        )}
      >
        <HeroSlideImage key={src} src={src} />
      </button>
      {slides.length > 1 && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute start-2 top-1/2 z-10 size-8 -translate-y-1/2 rounded-full opacity-80"
            onClick={() => go(i - 1)}
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute end-2 top-1/2 z-10 size-8 -translate-y-1/2 rounded-full opacity-80"
            onClick={() => go(i + 1)}
            aria-label="Next slide"
          >
            <ChevronRight className="size-4" />
          </Button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
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
