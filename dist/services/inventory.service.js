import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';
export class InventoryService {
    static async getInventoryOverview(consignorId) {
        const whereProduct = {};
        if (consignorId)
            whereProduct.consignorId = consignorId;
        const [totalProductsCount, totalUnitsAvailable, outOfStockCount, movementsSummary,] = await Promise.all([
            prisma.product.count({ where: whereProduct }),
            prisma.product.aggregate({
                where: whereProduct,
                _sum: { quantity: true },
            }),
            prisma.product.count({
                where: { ...whereProduct, quantity: 0 },
            }),
            prisma.stockMovement.groupBy({
                by: ['type'],
                _sum: { quantity: true },
            }),
        ]);
        return {
            totalProductsCount,
            totalUnitsAvailable: totalUnitsAvailable._sum.quantity || 0,
            outOfStockCount,
            movementsSummary,
        };
    }
    static async getStockMovements(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.productId)
            where.productId = query.productId;
        const [movements, total] = await Promise.all([
            prisma.stockMovement.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: { select: { name: true, sku: true } },
                },
            }),
            prisma.stockMovement.count({ where }),
        ]);
        return {
            movements,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    static async adjustStock(productId, adjustedQuantity, reason, userId) {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw new NotFoundError('Product not found');
        }
        const previousQuantity = product.quantity;
        const diff = adjustedQuantity - previousQuantity;
        const updated = await prisma.$transaction(async (tx) => {
            const p = await tx.product.update({
                where: { id: productId },
                data: {
                    quantity: adjustedQuantity,
                    status: adjustedQuantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
                },
            });
            await tx.stockMovement.create({
                data: {
                    productId,
                    type: 'ADJUSTMENT',
                    quantity: Math.abs(diff),
                    previousQuantity,
                    newQuantity: adjustedQuantity,
                    notes: `Stock adjustment: ${reason}`,
                    createdById: userId,
                },
            });
            return p;
        });
        return updated;
    }
}
