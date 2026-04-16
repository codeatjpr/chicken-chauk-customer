import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EmptyState } from '@/components/molecules/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type ProductGridProps = {
  children: ReactNode
  className?: string
}

export function ProductGrid({ children, className }: ProductGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  )
}

type ProductGridSkeletonProps = {
  count?: number
  className?: string
}

export function ProductGridSkeleton({
  count = 6,
  className,
}: ProductGridSkeletonProps) {
  return (
    <ProductGrid className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="aspect-[4/4.8] rounded-3xl" />
      ))}
    </ProductGrid>
  )
}

type ProductGridEmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
}

export function ProductGridEmptyState({
  icon,
  title,
  description,
  className,
}: ProductGridEmptyStateProps) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      className={cn('bg-card/40', className)}
    />
  )
}
