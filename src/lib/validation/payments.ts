import { z } from 'zod';

export const createOrderSchema = z.object({
  milestoneId: z.string().uuid(),
  contractId: z.string().uuid().optional(),
  returnUrl: z.string().url().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
});

export const verifyOrderSchema = z.object({
  orderId: z.string().min(1).max(100),
});
