import { z } from 'zod';
export const createPaymentSchema = z.object({
    body: z.object({
        userId: z.string().uuid('Invalid user ID'),
        amount: z.number().positive('Amount must be greater than 0'),
        type: z.enum(['CONSIGNOR_PAYOUT', 'CONSIGNEE_PAYMENT', 'OTHER']).default('CONSIGNOR_PAYOUT'),
        method: z.enum(['CASH', 'TRANSFER', 'POS']).default('TRANSFER'),
        notes: z.string().optional(),
    }),
});
export const updatePaymentStatusSchema = z.object({
    body: z.object({
        status: z.enum(['PAID', 'FAILED']),
        notes: z.string().optional(),
    }),
});
