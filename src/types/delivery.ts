/** Mirrors Prisma `Delivery` + `deliveryInclude` payload from GET /delivery/orders/:orderId */

export type DeliveryOrderAddressDto = {
  latitude: number
  longitude: number
  addressLine1: string
  city: string
}

export type DeliveryDetailDto = {
  id: string
  orderId: string
  riderId: string
  status: string
  order: {
    vendor: {
      id: string
      name: string
      latitude: number
      longitude: number
      addressLine: string | null
    }
    deliveryAddress: DeliveryOrderAddressDto | null
  }
  rider: {
    user: { name: string; phone: string }
  }
}

export type RiderLocationDto = {
  lat: number
  lng: number
  ts: number | null
}
