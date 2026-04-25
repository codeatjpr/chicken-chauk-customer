import { cn } from '@/lib/utils'

function looksLikeHtml(s: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(s)
}

type RichTextBodyProps = {
  /** HTML from a rich text editor, or plain text with line breaks from the admin form. */
  source: string | null | undefined
  className?: string
}

/**
 * Renders catalog/listing copy from the admin panel.
 * - **HTML** (TipTap, etc.): block tags become paragraph spacing; use semantic HTML, not one giant div.
 * - **Plain text**: line breaks in the string are shown (`white-space: pre-line`); innerHTML is not used,
 *   because HTML collapses newlines in plain text.
 */
export function RichTextBody({ source, className }: RichTextBodyProps) {
  const raw = (source ?? '').trim()
  if (!raw) return null

  if (looksLikeHtml(raw)) {
    return (
      <div
        className={cn(
          'max-w-none text-sm leading-relaxed [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_p]:mb-3 [&_p]:last:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-5',
          className,
        )}
        // Admin-controlled catalog content; same trust model as before.
        dangerouslySetInnerHTML={{ __html: raw }}
      />
    )
  }

  return <div className={cn('whitespace-pre-line', className)}>{raw}</div>
}
