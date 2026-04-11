import { Loader2Icon } from 'lucide-react'

export function PageSuspenseFallback() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-16"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <Loader2Icon className="text-primary size-8 animate-spin" aria-hidden />
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  )
}
