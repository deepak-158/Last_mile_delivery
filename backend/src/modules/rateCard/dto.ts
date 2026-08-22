import { z } from 'zod';

export const createRateCardSchema = z.object({
  orderType: z.enum(['B2B', 'B2C']),
  rateType: z.enum(['INTRA_ZONE', 'INTER_ZONE']),
  baseCharge: z.number().min(0, 'Base charge must be non-negative'),
  perKgCharge: z.number().min(0, 'Per-kg charge must be non-negative'),
});

export const updateRateCardSchema = z.object({
  baseCharge: z.number().min(0).optional(),
  perKgCharge: z.number().min(0).optional(),
});

export type CreateRateCardInput = z.infer<typeof createRateCardSchema>;
export type UpdateRateCardInput = z.infer<typeof updateRateCardSchema>;
