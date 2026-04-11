import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { PaginatedResult } from '@/types/pagination'
import type { ProductDetailDto, VendorProductDto } from '@/types/catalog'

export async function fetchProductById(id: string): Promise<ProductDetailDto> {
  const { data } = await axiosInstance.get<ApiSuccess<ProductDetailDto>>(
    `/catalog/products/${id}`,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Product not found')
  }
  return data.data
}

export async function fetchVendorProducts(
  vendorId: string,
  params?: { categoryId?: string; page?: number; limit?: number },
): Promise<PaginatedResult<VendorProductDto>> {
  const { data } = await axiosInstance.get<
    ApiSuccess<PaginatedResult<VendorProductDto>>
  >(`/catalog/vendors/${vendorId}/products`, {
    params: { page: 1, limit: 100, ...params },
  })
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Failed to load menu')
  }
  return data.data
}
