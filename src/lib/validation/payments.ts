import { z } from 'zod';
import { entityIdSchema } from '@/lib/validation';

export const createOrderSchema = z.object({
  milestoneId: entityIdSchema,
  contractId: entityIdSchema.optional(),
  returnUrl: z.string().url().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
});

export const verifyOrderSchema = z.object({
  orderId: z.string().min(1).max(100),
});
