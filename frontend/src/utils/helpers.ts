export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge-pending',
  PICKED_UP: 'badge-pickedup',
  IN_TRANSIT: 'badge-ontheway',
  OUT_FOR_DELIVERY: 'badge-ontheway',
  DELIVERED: 'badge-delivered',
  FAILED: 'badge-cancelled',
  CANCELLED: 'badge-cancelled',
  RESCHEDULED: 'badge-pending',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending Pickup',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  FAILED: 'Failed Attempt',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
};

export const STATUS_ICONS: Record<string, string> = {
  PENDING: '📋',
  PICKED_UP: '📦',
  IN_TRANSIT: '🚚',
  OUT_FOR_DELIVERY: '🏍️',
  DELIVERED: '✅',
  FAILED: '❌',
  CANCELLED: '🚫',
  RESCHEDULED: '🔄',
};

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0.00';
  }
  return `₹${Number(amount).toFixed(2)}`;
}

export function truncateId(id?: string | null): string {
  if (!id) return '';
  return id.slice(0, 8).toUpperCase();
}

/**
 * Robust extraction of total charge from DB or preview object
 */
export function getOrderCharge(order?: any): number {
  if (!order) return 0;
  return Number(order.totalCharge ?? order.computedCharge ?? order.baseCharge ?? 0);
}

/**
 * Robust extraction of actual weight (kg)
 */
export function getOrderActualWeight(order?: any): number {
  if (!order) return 0;
  return Number(order.actualWeightKg ?? order.actualWeight ?? 0);
}

/**
 * Robust extraction of billable weight (kg)
 */
export function getOrderBillableWeight(order?: any): number {
  if (!order) return 0;
  return Number(order.billableWeightKg ?? order.billableWeight ?? getOrderActualWeight(order));
}

/**
 * Robust extraction of Origin name
 */
export function getOrderOrigin(order?: any): string {
  if (!order) return 'Origin Hub';
  if (order.pickupCity && order.pickupCity !== 'Pickup') return order.pickupCity;
  if (order.pickupZone?.name) return order.pickupZone.name;
  if (order.pickupAddress) {
    const parts = order.pickupAddress.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2] || parts[parts.length - 1];
  }
  if (order.pickupPincode) return `PIN ${order.pickupPincode}`;
  return 'Origin Hub';
}

/**
 * Robust extraction of Destination name
 */
export function getOrderDestination(order?: any): string {
  if (!order) return 'Destination';
  if (order.dropCity && order.dropCity !== 'Drop') return order.dropCity;
  if (order.dropZone?.name) return order.dropZone.name;
  if (order.dropAddress) {
    const parts = order.dropAddress.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2] || parts[parts.length - 1];
  }
  if (order.dropPincode) return `PIN ${order.dropPincode}`;
  return 'Destination';
}
