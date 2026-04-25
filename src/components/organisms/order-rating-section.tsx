import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { queryKeys } from '@/constants/query-keys'
import * as ratingsApi from '@/services/ratings.service'
import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/utils/api-error'

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (n: number | null) => void
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-0.5">
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <button
            key={n}
            type="button"
            className={cn(
              'text-2xl leading-none transition-opacity',
              value != null && n <= value
                ? 'text-amber-500'
                : 'text-muted-foreground/35 hover:text-muted-foreground/60',
            )}
            aria-label={`${n} stars`}
            onClick={() => onChange(value === n ? null : n)}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

type OrderRatingSectionProps = {
  orderId: string
  vendorId: string
  hasRider: boolean
  enabled: boolean
}

export function OrderRatingSection({
  orderId,
  vendorId,
  hasRider,
  enabled,
}: OrderRatingSectionProps) {
  const qc = useQueryClient()
  const [vendorStars, setVendorStars] = useState<number | null>(null)
  const [productStars, setProductStars] = useState<number | null>(null)
  const [riderStars, setRiderStars] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const qEnabled = enabled && Boolean(orderId)

  const canRateQuery = useQuery({
    queryKey: queryKeys.ratings.canRate(orderId),
    queryFn: () => ratingsApi.fetchCanRate(orderId),
    enabled: qEnabled,
  })

  const existingQuery = useQuery({
    queryKey: queryKeys.ratings.myOrder(orderId),
    queryFn: () => ratingsApi.fetchMyOrderRating(orderId),
    enabled: qEnabled,
  })

  const submit = useMutation({
    mutationFn: () => {
      const hasAny =
        vendorStars != null ||
        productStars != null ||
        (hasRider && riderStars != null)
      if (!hasAny) {
        throw new Error('Pick at least one rating')
      }
      return ratingsApi.submitRating({
        orderId,
        vendorRating: vendorStars ?? undefined,
        productQualityRating: productStars ?? undefined,
        riderRating: hasRider ? riderStars ?? undefined : undefined,
        comment: comment.trim() || undefined,
        isPublic,
      })
    },
    onSuccess: () => {
      toast.success('Thanks for your feedback')
      void qc.invalidateQueries({ queryKey: queryKeys.ratings.canRate(orderId) })
      void qc.invalidateQueries({ queryKey: queryKeys.ratings.myOrder(orderId) })
      void qc.invalidateQueries({
        queryKey: queryKeys.ratings.vendorSummary(vendorId),
      })
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'Could not submit rating')),
  })

  if (!enabled) {
    return null
  }

  if (canRateQuery.isLoading || existingQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2Icon className="size-4 animate-spin" />
        Loading…
      </div>
    )
  }

  const existing = existingQuery.data
  if (existing) {
    return (
      <section className="border-border/80 bg-card rounded-xl border p-4">
        <h2 className="text-sm font-semibold tracking-tight">Your review</h2>
        <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
          {existing.vendorRating != null && (
            <li>Shop: {existing.vendorRating}/5</li>
          )}
          {existing.productQualityRating != null && (
            <li>Food quality: {existing.productQualityRating}/5</li>
          )}
          {existing.riderRating != null && (
            <li>Delivery: {existing.riderRating}/5</li>
          )}
          {existing.comment && (
            <li className="text-foreground pt-1">&ldquo;{existing.comment}&rdquo;</li>
          )}
        </ul>
      </section>
    )
  }

  if (!canRateQuery.data?.canRate) {
    return null
  }

  return (
    <section className="border-border/80 bg-card space-y-4 rounded-xl border p-4">
      <h2 className="text-sm font-semibold tracking-tight">Rate your order</h2>
      <p className="text-muted-foreground text-xs">
        Pick at least one category. Tap again on the same star to clear that row.
      </p>
      <StarRow label="Shop" value={vendorStars} onChange={setVendorStars} />
      <StarRow
        label="Food quality"
        value={productStars}
        onChange={setProductStars}
      />
      {hasRider && (
        <StarRow
          label="Delivery partner"
          value={riderStars}
          onChange={setRiderStars}
        />
      )}
      <div className="space-y-2">
        <Label htmlFor={`rating-comment-${orderId}`}>Comment (optional)</Label>
        <textarea
          id={`rating-comment-${orderId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="What went well or what could improve? (optional)"
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:ring-3 dark:bg-input/30"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        Show my first name on public reviews
      </label>
      <Button
        type="button"
        disabled={submit.isPending}
        onClick={() => submit.mutate()}
      >
        {submit.isPending && (
          <Loader2Icon className="size-4 animate-spin" />
        )}
        Submit review
      </Button>
    </section>
  )
}
