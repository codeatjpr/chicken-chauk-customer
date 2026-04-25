import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

type ProductImageGalleryProps = {
  urls: (string | null | undefined)[]
  alt: string
  className?: string
  imageClassName?: string
  discountPercent?: number | null
  /** When true, image area is dimmed and optional overlay is shown. */
  unavailable?: boolean
  unavailableLabel?: string
  fallbackLetter?: string
}

type ProductImageGalleryInnerProps = Omit<ProductImageGalleryProps, 'urls'> & {
  slides: string[]
}

function ProductImageGalleryInner({
  slides,
  alt,
  className,
  imageClassName,
  discountPercent,
  unavailable,
  unavailableLabel = 'Unavailable',
  fallbackLetter = '?',
}: ProductImageGalleryInnerProps) {
  const [index, setIndex] = useState(0)
  const n = slides.length
  const safeIndex = n === 0 ? 0 : index % n

  const go = useCallback(
    (dir: -1 | 1) => {
      if (n <= 1) return
      setIndex((i) => (i + dir + n) % n)
    },
    [n],
  )

  return (
    <div
      className={cn(
        'bg-muted from-muted/90 to-muted/60 relative aspect-4/3 w-full max-w-md overflow-hidden rounded-2xl border bg-linear-to-b shadow-sm sm:max-w-none',
        className,
      )}
    >
      {n > 0 ? (
        <img
          key={slides[safeIndex]}
          src={slides[safeIndex]}
          alt={alt}
          className={cn('size-full object-cover', imageClassName, unavailable && 'opacity-85')}
        />
      ) : (
        <div className="text-muted-foreground flex size-full items-center justify-center text-6xl font-semibold">
          {fallbackLetter.slice(0, 1)}
        </div>
      )}

      {discountPercent != null && discountPercent > 0 ? (
        <div className="absolute left-3 top-3 z-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow">
          {discountPercent}% off
        </div>
      ) : null}

      {n > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="bg-background/95 text-foreground border-border/60 absolute left-2 top-1/2 z-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-md transition hover:bg-background"
            aria-label="Previous image"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="bg-background/95 text-foreground border-border/60 absolute right-2 top-1/2 z-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-md transition hover:bg-background"
            aria-label="Next image"
          >
            <ChevronRight className="size-5" />
          </button>
          <div
            className="absolute bottom-3 left-0 right-0 z-3 flex justify-center gap-1.5"
            role="tablist"
            aria-label="Image gallery"
          >
            {slides.map((u, i) => (
              <button
                key={u + i}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                className={cn(
                  'size-1.5 rounded-full transition',
                  i === safeIndex ? 'w-2 bg-white' : 'bg-white/50',
                )}
                onClick={() => setIndex(i)}
                aria-label={`Image ${i + 1} of ${n}`}
              />
            ))}
          </div>
        </>
      ) : null}

      {unavailable ? (
        <div className="absolute inset-0 z-2 flex items-center justify-center rounded-2xl bg-black/35 backdrop-blur-[1px]">
          <span className="rounded-full bg-black/65 px-4 py-2 text-sm font-semibold text-white">
            {unavailableLabel}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export function ProductImageGallery({
  urls,
  alt,
  className,
  imageClassName,
  discountPercent,
  unavailable,
  unavailableLabel,
  fallbackLetter,
}: ProductImageGalleryProps) {
  const slides = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const u of urls) {
      if (!u) continue
      if (seen.has(u)) continue
      seen.add(u)
      out.push(u)
    }
    return out
  }, [urls])

  const slidesKey = slides.join('\0')

  return (
    <ProductImageGalleryInner
      key={slidesKey}
      slides={slides}
      alt={alt}
      className={className}
      imageClassName={imageClassName}
      discountPercent={discountPercent}
      unavailable={unavailable}
      unavailableLabel={unavailableLabel}
      fallbackLetter={fallbackLetter}
    />
  )
}
