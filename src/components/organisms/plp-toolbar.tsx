import type { ReactNode } from 'react'
import { Grid2x2, LayoutList, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type PlpSort = 'relevance' | 'price_asc' | 'price_desc'

type Props = {
  sort: PlpSort
  onSortChange: (s: PlpSort) => void
  view: 'grid' | 'list'
  onViewChange: (v: 'grid' | 'list') => void
  showing: number
  total: number
  className?: string
  /** Extra filter slot (e.g. category select) */
  extra?: ReactNode
  onFiltersClick?: () => void
}

export function PlpToolbar({
  sort,
  onSortChange,
  view,
  onViewChange,
  showing,
  total,
  className,
  extra,
  onFiltersClick,
}: Props) {
  return (
    <div
      className={cn(
        'border-border/80 bg-card/80 flex flex-col flex-wrap gap-3 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onFiltersClick}
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
        </Button>
        {extra}
        <Select value={sort} onValueChange={(v) => onSortChange(v as PlpSort)}>
          <SelectTrigger className="h-8 w-[190px] text-xs sm:text-sm">
            <SelectValue placeholder="Sort by…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Sort by: Relevance</SelectItem>
            <SelectItem value="price_asc">Price: Low to high</SelectItem>
            <SelectItem value="price_desc">Price: High to low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="border-border/60 flex rounded-lg border p-0.5">
          <button
            type="button"
            onClick={() => onViewChange('grid')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              view === 'grid' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted',
            )}
            aria-label="Grid view"
          >
            <Grid2x2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange('list')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              view === 'list' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted',
            )}
            aria-label="List view"
          >
            <LayoutList className="size-4" />
          </button>
        </div>
        <span className="text-muted-foreground text-xs sm:text-sm">
          Showing {showing} of {total}
        </span>
      </div>
    </div>
  )
}
