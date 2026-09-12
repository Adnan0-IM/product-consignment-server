import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/p-consignment?schema=public',
    JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-product-consignment-2026',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    DEFAULT_CONSIGNOR_COMMISSION: parseFloat(process.env.DEFAULT_CONSIGNOR_COMMISSION || '70.0'), // 70% to consignor
    DEFAULT_CONSIGNEE_COMMISSION: parseFloat(process.env.DEFAULT_CONSIGNEE_COMMISSION || '20.0'), // 20% to consignee
    DEFAULT_ADMIN_COMMISSION: parseFloat(process.env.DEFAULT_ADMIN_COMMISSION || '10.0'), // 10% to system admin
};
