import type { HeroCarouselSlideDto } from '@/types/discovery'

export function resolveHeroImage(
  slide: Pick<HeroCarouselSlideDto, 'imageUrl' | 'imageUrlMobile' | 'imageUrlDesktop'>,
  isMdUp: boolean,
): string {
  const u = isMdUp ? slide.imageUrlDesktop : slide.imageUrlMobile
  const s = (u ?? '').trim()
  return s || slide.imageUrl
}

/** Mobile 16:9; desktop 3:1. Separate mobile/desktop assets optional for art direction. */
export const heroCarouselAspectClass = 'aspect-video lg:aspect-[3/1]'
