import type { OrderStatusDto } from '@/types/order'

const LABELS: Record<OrderStatusDto, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready for pickup',
  PICKED_UP: 'Picked up',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

export function orderStatusLabel(status: OrderStatusDto): string {
  return LABELS[status] ?? status
}

export function customerCanCancel(status: OrderStatusDto): boolean {
  return status === 'PLACED' || status === 'CONFIRMED'
}
