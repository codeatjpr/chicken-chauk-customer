import { axiosInstance } from '@/lib/axiosInstance'
import type { ApiSuccess } from '@/types/api'
import type { PaginatedResult } from '@/types/pagination'
import type {
  CategoryDto,
  ProductDetailDto,
  ProductListItemDto,
  ProductVariantDto,
  VendorProductDto,
} from '@/types/catalog'

export async function fetchCategories(): Promise<CategoryDto[]> {
  const { data } = await axiosInstance.get<ApiSuccess<CategoryDto[]>>(
    '/catalog/categories',
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not load categories')
  }
  return data.data
}

export async function fetchCategoryById(id: string): Promise<CategoryDto> {
  const { data } = await axiosInstance.get<ApiSuccess<CategoryDto>>(
    `/catalog/categories/${id}`,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Category not found')
  }
  return data.data
}

export async function fetchProducts(params: {
  categoryId?: string
  search?: string
  page?: number
  limit?: number
}): Promise<PaginatedResult<ProductListItemDto>> {
  const { data } = await axiosInstance.get<
    ApiSuccess<PaginatedResult<ProductListItemDto>>
  >('/catalog/products', {
    params: {
      page: 1,
      limit: 24,
      isActive: 'true',
      ...params,
    },
  })
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not load products')
  }
  return data.data
}

export async function fetchProductById(id: string): Promise<ProductDetailDto> {
  const { data } = await axiosInstance.get<ApiSuccess<ProductDetailDto>>(
    `/catalog/products/${id}`,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Product not found')
  }
  return data.data
}

export async function fetchProductVariants(id: string): Promise<ProductVariantDto[]> {
  const { data } = await axiosInstance.get<ApiSuccess<ProductVariantDto[]>>(
    `/catalog/products/${id}/variants`,
  )
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Could not load product variants')
  }
  return data.data
}

export async function fetchVendorProducts(
  vendorId: string,
  params?: {
    categoryId?: string
    search?: string
    page?: number
    limit?: number
  },
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
