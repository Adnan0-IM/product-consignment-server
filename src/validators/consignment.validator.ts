import { z } from 'zod'

export const createConsignmentSchema = z.object({
  body: z.object({
    consigneeId: z.string().uuid('Invalid Consignee ID'),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string().uuid('Invalid product ID'),
        quantity: z.number().int().positive('Quantity must be at least 1'),
        unitPrice: z.number().positive('Unit price must be positive'),
      })
    ).min(1, 'At least one consignment item is required'),
  }),
})

export const updateConsignmentStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED', 'COMPLETED', 'RETURNED']),
    notes: z.string().optional(),
  }),
})
