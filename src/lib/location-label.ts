/**
 * Strip mistaken literal `bold(...)` segments (e.g. from bad templates) and trim.
 */
export function sanitizeLocationDisplayText(value: string): string {
  return value
    .trim()
    .replace(/\bbold\s*\(\s*([^)]+?)\s*\)/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Short human-readable coordinates when no address line is available. */
export function formatShortCoordLabel(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`
}

/**
 * Split a formatted address into a short headline (area / first segment) + rest,
 * similar to quick-scan location chips in delivery apps.
 */
export function splitLocationDisplay(full: string): {
  primary: string
  secondary: string | null
} {
  const t = full.trim()
  if (!t) return { primary: '', secondary: null }

  const comma = t.indexOf(',')
  if (comma !== -1) {
    const a = t.slice(0, comma).trim()
    const b = t.slice(comma + 1).trim()
    return { primary: a || t, secondary: b || null }
  }

  // No comma: keep one line (avoid "Pinned — location" style splits on short fallbacks).
  return { primary: t, secondary: null }
}
