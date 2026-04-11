import type { OrderDetailDto, OrderListItemDto } from '@/types/order'

export function canReorderFromOrder(order: OrderDetailDto) {
  return (
    order.status !== 'CANCELLED' &&
    order.status !== 'REFUNDED' &&
    order.items.length > 0
  )
}

export function canReorderFromListItem(
  o: Pick<OrderListItemDto, 'status' | '_count'>,
) {
  return (
    o.status !== 'CANCELLED' &&
    o.status !== 'REFUNDED' &&
    o._count.items > 0
  )
}
