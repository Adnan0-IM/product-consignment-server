import { z } from 'zod';
export const registerSchema = z.object({
    body: z.object({
        firstName: z.string().min(2, 'First name must be at least 2 characters'),
        lastName: z.string().min(2, 'Last name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        phone: z.string().optional(),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role: z.enum(['CONSIGNOR', 'CONSIGNEE']).default('CONSIGNOR'),
    }),
});
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
});
export const updateProfileSchema = z.object({
    body: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        gender: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        accountName: z.string().optional(),
    }),
});
export const changePasswordSchema = z.object({
    body: z.object({
        oldPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    }),
});
