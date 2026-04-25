/** Pack / listing display helpers (vendor listing fields). */

export function formatPackLine(
  quantityValue: number | null | undefined,
  quantityUnit: string | null | undefined,
): string | null {
  if (quantityValue == null) return null
  const u = (quantityUnit ?? '').trim()
  return u ? `${quantityValue} ${u}` : String(quantityValue)
}

/** Weight / pack size for display: `500 g`, or unit-only when value is missing (e.g. `500g` in unit field). */
export function listingSizeLabel(
  quantityValue: number | null | undefined,
  quantityUnit: string | null | undefined,
): string {
  const line = formatPackLine(quantityValue, quantityUnit)
  if (line) return line
  return (quantityUnit ?? '').trim()
}

export function piecesDisplay(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  if (/piece|pcs\b|pc\b/i.test(t)) return t
  return `${t} Pieces`
}

export function servingsDisplay(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  if (/serve/i.test(t)) return t
  return `${t} Servings`
}
