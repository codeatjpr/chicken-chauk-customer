import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const DEFAULT_CITY = 'Delhi'
const DEFAULT_LAT = 28.6139
const DEFAULT_LNG = 77.209

type LocationState = {
  city: string
  latitude: number
  longitude: number
  setLocation: (city: string, latitude: number, longitude: number) => void
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      city: DEFAULT_CITY,
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LNG,
      setLocation: (city, latitude, longitude) =>
        set({ city, latitude, longitude }),
    }),
    {
      name: 'chicken-chauk-location',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        city: s.city,
        latitude: s.latitude,
        longitude: s.longitude,
      }),
    },
  ),
)

export function getDefaultLocation() {
  return { city: DEFAULT_CITY, latitude: DEFAULT_LAT, longitude: DEFAULT_LNG }
}
