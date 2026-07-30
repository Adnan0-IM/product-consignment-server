import { z } from 'zod'

export const createSaleSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['CASH', 'TRANSFER', 'POS']).default('CASH'),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string().uuid('Invalid product ID'),
        quantity: z.number().int().positive('Quantity must be at least 1'),
      })
    ).min(1, 'At least one sale item is required'),
  }),
})
