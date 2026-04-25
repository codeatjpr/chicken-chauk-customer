export type AddressLabel = 'HOME' | 'WORK' | 'OTHER'

export type UserAddressDto = {
  id: string
  userId: string
  label: AddressLabel
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  pincode: string
  latitude: number
  longitude: number
  mapFormattedAddress: string | null
  plusCode: string | null
  isDefault: boolean
  createdAt: string
}
