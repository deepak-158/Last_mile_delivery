import { z } from 'zod';

export const savedAddressSchema = z.object({
  label: z.string().min(1, 'Label is required (e.g. Home, Office, Warehouse)'),
  contactName: z.string().min(1, 'Contact person name is required'),
  contactPhone: z.string().min(6, 'Valid contact phone number is required'),
  pincode: z.string().length(6, '6-digit pincode is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  locality: z.string().optional(),
  address: z.string().min(1, 'Street / Flat / Doorstep address is required'),
});

export type SavedAddressInput = z.infer<typeof savedAddressSchema>;
