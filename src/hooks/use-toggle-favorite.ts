import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/query-keys'
import { toggleFavoriteApi } from '@/services/discovery.service'
import { useLocationStore } from '@/stores/location-store'

export function useToggleFavorite() {
  const qc = useQueryClient()
  const { city, latitude, longitude } = useLocationStore()

  return useMutation({
    mutationFn: toggleFavoriteApi,
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.discovery.home(city, latitude, longitude),
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.vendors.nearby(city, latitude, longitude),
      })
      void qc.invalidateQueries({ queryKey: queryKeys.discovery.searchPrefix })
    },
  })
}
