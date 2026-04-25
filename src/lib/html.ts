/**
 * Convert HTML to a **single-line** plain string for short previews (cards, clamped text).
 * Collapses all whitespace, including newlines and gaps between `</p><p>`, by design.
 * For full product/listing copy on a detail page, use `RichTextBody` or plain text
 * with `white-space: pre-line` — do not use this for that.
 */
export function stripHtmlToPlainText(html: string): string {
  const s = html.trim()
  if (!s) return ''
  if (typeof document !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(s, 'text/html')
      const text = doc.body.textContent ?? ''
      return text.replace(/\s+/g, ' ').trim()
    } catch {
      // fall through
    }
  }
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
