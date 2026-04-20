/**
 * Convert HTML-ish strings (e.g. TipTap output: `<p>Hello</p>`) to plain text for previews.
 * React text nodes do not parse HTML — without this, users see raw tags in cards.
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
