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
  isDefault: boolean
  createdAt: string
}
