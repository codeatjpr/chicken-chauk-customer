import type { PlpSort } from '@/components/organisms/plp-toolbar'

type Priceable = { price: number; id: string }

export function sortByPlp<T extends Priceable>(items: T[], sort: PlpSort): T[] {
  const copy = [...items]
  if (sort === 'relevance') return copy
  copy.sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price
    if (sort === 'price_desc') return b.price - a.price
    return 0
  })
  return copy
}
