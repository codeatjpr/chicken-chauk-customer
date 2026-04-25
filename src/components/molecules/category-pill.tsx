import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type CategoryPillProps = {
  label: string
  imageUrl?: string | null
  /** When set, shown inside the circle instead of the image (e.g. “All” grid icon). */
  leadingIcon?: ReactNode
  active?: boolean
  to?: string
  onClick?: () => void
  className?: string
}

function CategoryPillContent({
  label,
  imageUrl,
  leadingIcon,
  active,
}: Pick<CategoryPillProps, 'label' | 'imageUrl' | 'leadingIcon' | 'active'>) {
  return (
    <>
      <div
        className={cn(
          'bg-muted flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/5 dark:ring-white/10',
        )}
      >
        {leadingIcon ? (
          <span className="text-muted-foreground flex size-full items-center justify-center">
            {leadingIcon}
          </span>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="size-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="text-muted-foreground text-xs font-semibold">
            {label.slice(0, 1)}
          </span>
        )}
      </div>
      <span
        className={cn('line-clamp-1 min-w-0 text-sm font-semibold text-foreground', active && 'font-bold')}
      >
        {label}
      </span>
    </>
  )
}

export function CategoryPill({
  label,
  imageUrl,
  leadingIcon,
  active = false,
  to,
  onClick,
  className,
}: CategoryPillProps) {
  const classes = cn(
    'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all',
    active
      ? 'border-border bg-muted/70 text-foreground shadow-sm'
      : 'border-border/80 bg-card hover:bg-muted/60',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        <CategoryPillContent
          label={label}
          imageUrl={imageUrl}
          leadingIcon={leadingIcon}
          active={active}
        />
      </Link>
    )
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      <CategoryPillContent
        label={label}
        imageUrl={imageUrl}
        leadingIcon={leadingIcon}
        active={active}
      />
    </button>
  )
}
