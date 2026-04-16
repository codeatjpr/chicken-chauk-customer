import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type CategoryPillProps = {
  label: string
  imageUrl?: string | null
  active?: boolean
  to?: string
  onClick?: () => void
  className?: string
}

function CategoryPillContent({
  label,
  imageUrl,
  active,
}: Pick<CategoryPillProps, 'label' | 'imageUrl' | 'active'>) {
  return (
    <>
      <div
        className={cn(
          'bg-muted flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/5 dark:ring-white/10',
          active && 'ring-primary/25 bg-primary/5',
        )}
      >
        {imageUrl ? (
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
      <span className="line-clamp-1 min-w-0 text-sm font-medium">{label}</span>
    </>
  )
}

export function CategoryPill({
  label,
  imageUrl,
  active = false,
  to,
  onClick,
  className,
}: CategoryPillProps) {
  const classes = cn(
    'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all',
    active
      ? 'border-primary/30 bg-primary/10 text-primary shadow-sm'
      : 'border-border/80 bg-card hover:border-primary/20 hover:bg-muted/60',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        <CategoryPillContent label={label} imageUrl={imageUrl} active={active} />
      </Link>
    )
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      <CategoryPillContent label={label} imageUrl={imageUrl} active={active} />
    </button>
  )
}
