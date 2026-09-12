import { z } from 'zod';
export const createProductSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Product name is required'),
        description: z.string().optional(),
        categoryId: z.string().optional(),
        categoryIds: z.array(z.string()).optional(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        quantity: z.number().int().min(0).default(0),
        unitPrice: z.number().positive('Price must be greater than 0'),
        consignorRate: z.number().min(0).max(100).optional(),
        consigneeRate: z.number().min(0).max(100).optional(),
    }),
});
export const updateProductSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        categoryId: z.string().optional(),
        categoryIds: z.array(z.string()).optional(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        quantity: z.number().int().min(0).optional(),
        unitPrice: z.number().positive().optional(),
        consignorRate: z.number().min(0).max(100).optional(),
        consigneeRate: z.number().min(0).max(100).optional(),
        status: z.enum(['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED']).optional(),
    }),
});
