import { z } from 'zod';

export const upsertCODConfigSchema = z.object({
  orderType: z.enum(['B2B', 'B2C']),
  surchargeAmount: z.number().min(0, 'Surcharge must be non-negative'),
});

export type UpsertCODConfigInput = z.infer<typeof upsertCODConfigSchema>;
