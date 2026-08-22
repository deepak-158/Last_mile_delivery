import { z } from 'zod';

export const createZoneSchema = z.object({
  name: z.string().min(1, 'Zone name is required'),
  description: z.string().optional(),
});

export const updateZoneSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const addAreaMappingSchema = z.object({
  areaIdentifier: z.string().min(1, 'Area identifier is required'),
  areaType: z.enum(['PINCODE', 'LOCALITY']),
});

export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type AddAreaMappingInput = z.infer<typeof addAreaMappingSchema>;
