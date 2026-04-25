export type LocationSelection = {
  latitude: number
  longitude: number
  displayName: string
  city?: string
  state?: string
  pincode?: string
  area?: string
  /** When available from Google address components (for form prefill). */
  addressLine1?: string
  /** Open Location Code (Plus Code) for the pin, when available. */
  plusCode?: string
}
