import { OrderStatus } from '../types/enums';

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]:          [OrderStatus.PICKED_UP],
  [OrderStatus.PICKED_UP]:        [OrderStatus.IN_TRANSIT],
  [OrderStatus.IN_TRANSIT]:       [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
  [OrderStatus.DELIVERED]:        [],
  [OrderStatus.FAILED]:           [OrderStatus.RESCHEDULED],
  [OrderStatus.RESCHEDULED]:      [OrderStatus.PICKED_UP],
};

export function isValidTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  return ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:          'Pending',
  [OrderStatus.PICKED_UP]:        'Picked Up',
  [OrderStatus.IN_TRANSIT]:       'In Transit',
  [OrderStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [OrderStatus.DELIVERED]:        'Delivered',
  [OrderStatus.FAILED]:           'Failed',
  [OrderStatus.RESCHEDULED]:      'Rescheduled',
};
