/** Deterministic “merch” corner tag for demos when API has no label yet. */
export function pickMerchLabel(
  seed: string,
  index: number,
): { text: string; tone: 'primary' | 'success' } | null {
  const n = (seed.length + index * 7) % 5
  if (n === 0) return { text: 'BEST SELLER', tone: 'primary' }
  if (n === 1) return { text: 'FRESH CUT', tone: 'success' }
  if (n === 2) return { text: 'VALUE PACK', tone: 'primary' }
  return null
}
