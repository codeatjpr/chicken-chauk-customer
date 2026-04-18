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

/** Tailwind classes for the status badge (bg + text). */
export function orderStatusBadgeClass(status: OrderStatusDto): string {
  switch (status) {
    case 'PLACED':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'CONFIRMED':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    case 'PREPARING':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'READY':
    case 'PICKED_UP':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
    case 'OUT_FOR_DELIVERY':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'DELIVERED':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'CANCELLED':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'REFUNDED':
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}
