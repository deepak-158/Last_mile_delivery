export enum Role {
  CUSTOMER = 'CUSTOMER',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN',
}

export enum AreaType {
  PINCODE = 'PINCODE',
  LOCALITY = 'LOCALITY',
}

export enum OrderType {
  B2B = 'B2B',
  B2C = 'B2C',
}

export enum RateType {
  INTRA_ZONE = 'INTRA_ZONE',
  INTER_ZONE = 'INTER_ZONE',
}

export enum PaymentType {
  PREPAID = 'PREPAID',
  COD = 'COD',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum NotificationType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  RESCHEDULE = 'RESCHEDULE',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}
