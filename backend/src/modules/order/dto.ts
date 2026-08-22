import { z } from 'zod';

export const orderPreviewSchema = z.object({
  senderName: z.string().optional(),
  senderPhone: z.string().optional(),
  pickupAddress: z.string().min(1, 'Pickup home / street address is required'),
  pickupPincode: z.string().min(4, 'Pickup pincode is required'),
  pickupLocality: z.string().optional(),
  pickupCity: z.string().optional(),
  pickupState: z.string().optional(),
  savePickupAddress: z.boolean().optional(),
  pickupAddressLabel: z.string().optional(),

  receiverName: z.string().optional(),
  receiverPhone: z.string().optional(),
  dropAddress: z.string().min(1, 'Drop home / street address is required'),
  dropPincode: z.string().min(4, 'Drop pincode is required'),
  dropLocality: z.string().optional(),
  dropCity: z.string().optional(),
  dropState: z.string().optional(),
  saveDropAddress: z.boolean().optional(),
  dropAddressLabel: z.string().optional(),

  lengthCm: z.number().positive('Length must be positive'),
  breadthCm: z.number().positive('Breadth must be positive'),
  heightCm: z.number().positive('Height must be positive'),
  actualWeightKg: z.number().positive('Weight must be positive'),
  orderType: z.enum(['B2B', 'B2C']),
  paymentType: z.enum(['PREPAID', 'COD']),
});

export const orderCreateSchema = orderPreviewSchema.extend({
  senderName: z.string().min(1, 'Sender contact name is required'),
  senderPhone: z.string().min(6, 'Sender contact phone is required'),
  receiverName: z.string().min(1, 'Receiver / Consignee contact name is required'),
  receiverPhone: z.string().min(6, 'Receiver / Consignee contact phone is required'),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    'PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
    'DELIVERED', 'FAILED', 'RESCHEDULED',
  ]),
  notes: z.string().optional(),
});

export const orderRescheduleSchema = z.object({
  rescheduleDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
});

export type OrderPreviewInput = z.infer<typeof orderPreviewSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
export type OrderRescheduleInput = z.infer<typeof orderRescheduleSchema>;
