import { z } from 'zod';

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  currentZoneId: z.string().optional(),
});

export const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const manualAssignSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type ManualAssignInput = z.infer<typeof manualAssignSchema>;
