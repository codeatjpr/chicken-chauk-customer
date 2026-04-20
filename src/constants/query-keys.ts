const root = ['chicken-chauk'] as const

export const queryKeys = {
  root,
  auth: {
    me: [...root, 'auth', 'me'] as const,
  },
  discovery: {
    home: (city: string, lat: number, lng: number) =>
      [...root, 'discovery', 'home', city, lat, lng] as const,
    products: (city: string, categoryId?: string, search?: string) =>
      [...root, 'discovery', 'products', city, categoryId ?? 'all', search ?? ''] as const,
    search: (q: string, city: string) =>
      [...root, 'discovery', 'search', city, q] as const,
    searchPrefix: [...root, 'discovery', 'search'] as const,
  },
  vendors: {
    nearby: (city: string, lat: number, lng: number) =>
      [...root, 'vendors', 'nearby', city, lat, lng] as const,
    detail: (id: string) => [...root, 'vendors', 'detail', id] as const,
  },
  catalog: {
    categories: [...root, 'catalog', 'categories'] as const,
    category: (id: string) => [...root, 'catalog', 'category', id] as const,
    products: (categoryId: string) =>
      [...root, 'catalog', 'products', categoryId] as const,
    productsAll: [...root, 'catalog', 'products', 'all'] as const,
    product: (id: string) => [...root, 'catalog', 'product', id] as const,
    vendorProducts: (
      vendorId: string,
      categoryId?: string,
      search?: string,
    ) =>
      [
        ...root,
        'catalog',
        'vendor-products',
        vendorId,
        categoryId ?? 'all',
        search ?? '',
      ] as const,
    vendorProduct: (id: string) => [...root, 'catalog', 'vendor-product', id] as const,
  },
  cart: {
    summary: [...root, 'cart'] as const,
    guestSummary: [...root, 'cart', 'guest'] as const,
  },
  addresses: {
    list: [...root, 'addresses'] as const,
  },
  orders: {
    prefix: [...root, 'orders'] as const,
    list: (page: number, activeOnly: boolean) =>
      [...root, 'orders', 'list', page, activeOnly] as const,
    detail: (id: string) => [...root, 'orders', 'detail', id] as const,
  },
  profile: {
    stats: [...root, 'profile', 'stats'] as const,
  },
  ratings: {
    vendorSummary: (vendorId: string) =>
      [...root, 'ratings', 'vendor-summary', vendorId] as const,
    canRate: (orderId: string) =>
      [...root, 'ratings', 'can-rate', orderId] as const,
    myOrder: (orderId: string) =>
      [...root, 'ratings', 'my-order', orderId] as const,
  },
  delivery: {
    forOrder: (orderId: string) =>
      [...root, 'delivery', 'order', orderId] as const,
    riderLocation: (riderId: string) =>
      [...root, 'delivery', 'rider-location', riderId] as const,
  },
  maps: {
    drivingRoute: (
      deliveryId: string,
      originLat: number | undefined,
      originLng: number | undefined,
      destLat: number | undefined,
      destLng: number | undefined,
    ) =>
      [
        ...root,
        'maps',
        'driving-route',
        deliveryId,
        originLat ?? '_',
        originLng ?? '_',
        destLat ?? '_',
        destLng ?? '_',
      ] as const,
  },
  wallet: {
    summary: [...root, 'wallet', 'summary'] as const,
    transactions: (page: number, type?: 'CREDIT' | 'DEBIT') =>
      [...root, 'wallet', 'transactions', page, type ?? 'all'] as const,
  },
  favorites: {
    all: [...root, 'favorites', 'all'] as const,
  },
  notifications: {
    list: (page: number) => [...root, 'notifications', 'list', page] as const,
    unreadCount: [...root, 'notifications', 'unread-count'] as const,
  },
} as const
