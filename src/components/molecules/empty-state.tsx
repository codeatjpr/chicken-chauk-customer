import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-border/60 flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Icon
        className="text-muted-foreground mb-3 size-10 shrink-0 opacity-80"
        aria-hidden
      />
      <p className="text-foreground font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm leading-relaxed">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}
