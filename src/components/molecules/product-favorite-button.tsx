import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { queryKeys } from '@/constants/query-keys'
import { ROUTES } from '@/constants/routes'
import * as favoritesApi from '@/services/favorites.service'
import { toggleFavoriteApi } from '@/services/discovery.service'
import { useAuthStore, selectIsAuthenticated } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

type ProductFavoriteButtonProps = {
  productId: string
  className?: string
}

export function ProductFavoriteButton({
  productId,
  className,
}: ProductFavoriteButtonProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const authed = useAuthStore(selectIsAuthenticated)

  const favQuery = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: () => favoritesApi.fetchFavorites(),
    enabled: authed,
    staleTime: 60_000,
    select: (d) => d.products.some((p) => p.id === productId),
  })

  const isFavorite = favQuery.data ?? false

  const mut = useMutation({
    mutationFn: () =>
      toggleFavoriteApi({ type: 'PRODUCT', referenceId: productId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.favorites.all })
      void qc.invalidateQueries({ queryKey: queryKeys.discovery.searchPrefix })
    },
  })

  const loginState = {
    from: `${location.pathname}${location.search}${location.hash}`,
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      className={cn(
        'border-border/80 bg-background/90 hover:bg-background shadow-sm backdrop-blur-sm',
        className,
      )}
      disabled={authed && mut.isPending}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite ? 'Remove from favorites' : 'Save dish to favorites'
      }
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!authed) {
          navigate(ROUTES.login, { state: loginState })
          return
        }
        mut.mutate()
      }}
    >
      <Heart
        className={cn(
          'size-4',
          isFavorite && 'fill-primary text-primary',
        )}
        aria-hidden
      />
    </Button>
  )
}
