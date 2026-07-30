import { z } from 'zod'

export const createReturnSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    consignmentId: z.string().uuid().optional(),
    quantity: z.number().int().positive('Quantity must be at least 1'),
    reason: z.string().min(3, 'Reason is required'),
  }),
})

export const updateReturnStatusSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'COMPLETED']),
  }),
})
