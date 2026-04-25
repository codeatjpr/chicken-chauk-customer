import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { AddressLabel, UserAddressDto } from '@/types/address'

export async function fetchAddresses(): Promise<UserAddressDto[]> {
  const { data } = await axiosInstance.get<ApiSuccess<UserAddressDto[]>>(
    '/users/me/addresses',
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not load addresses')
  }
  return data.data
}

export async function createAddress(body: {
  label: AddressLabel
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  latitude: number
  longitude: number
  mapFormattedAddress?: string
  plusCode?: string
  isDefault?: boolean
}): Promise<UserAddressDto> {
  const { data } = await axiosInstance.post<ApiSuccess<UserAddressDto>>(
    '/users/me/addresses',
    body,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not save address')
  }
  return data.data
}

export async function updateAddress(
  id: string,
  body: Partial<{
    label: AddressLabel
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    pincode: string
    latitude: number
    longitude: number
    mapFormattedAddress: string | null | undefined
    plusCode: string | null | undefined
    isDefault: boolean
  }>,
): Promise<UserAddressDto> {
  const { data } = await axiosInstance.put<ApiSuccess<UserAddressDto>>(
    `/users/me/addresses/${id}`,
    body,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not update address')
  }
  return data.data
}

export async function deleteAddress(id: string): Promise<void> {
  const { data } = await axiosInstance.delete<ApiSuccess<unknown>>(
    `/users/me/addresses/${id}`,
  )
  if (!data.success) {
    throw new Error(data.message ?? 'Could not delete address')
  }
}

export async function setDefaultAddress(id: string): Promise<UserAddressDto> {
  const { data } = await axiosInstance.patch<ApiSuccess<UserAddressDto>>(
    `/users/me/addresses/${id}/default`,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not set default address')
  }
  return data.data
}
