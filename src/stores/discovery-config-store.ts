import { create } from 'zustand'
import { CUSTOMER_DISCOVERY_RADIUS_KM } from '@/constants/customer-discovery-geo'

type DiscoveryConfigState = {
  /**
   * Synced from `HomeScreenData.discoveryRadiusKm` so `/vendors/nearby` matches the server
   * without duplicating the number in two repos long-term.
   */
  radiusKm: number
  setRadiusKm: (km: number) => void
}

export const useDiscoveryConfigStore = create<DiscoveryConfigState>((set) => ({
  radiusKm: CUSTOMER_DISCOVERY_RADIUS_KM,
  setRadiusKm: (km) =>
    set({
      radiusKm:
        Number.isFinite(km) && km > 0 ? km : CUSTOMER_DISCOVERY_RADIUS_KM,
    }),
}))

/** Use for API calls outside React (e.g. `fetchNearbyVendors`). */
export function getDiscoveryRadiusKm(): number {
  return useDiscoveryConfigStore.getState().radiusKm
}
