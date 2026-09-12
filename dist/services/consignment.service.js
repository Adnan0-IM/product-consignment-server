import { prisma } from '../config/prisma.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
export class ConsignmentService {
    // Consignee requests products from Consignor
    static async requestConsignment(consigneeId, data) {
        const consignor = await prisma.user.findUnique({
            where: { id: data.consignorId },
        });
        if (!consignor || consignor.role !== 'CONSIGNOR') {
            throw new BadRequestError('Invalid consignor user specified');
        }
        let totalQuantity = 0;
        let totalAmount = 0;
        const itemsData = [];
        for (const item of data.items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            });
            if (!product) {
                throw new NotFoundError(`Product ${item.productId} not found`);
            }
            const unitPrice = Number(product.unitPrice);
            totalQuantity += item.quantity;
            totalAmount += item.quantity * unitPrice;
            itemsData.push({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: unitPrice,
            });
        }
        const consignmentCode = `CSG-${Date.now().toString().slice(-6)}`;
        const consignment = await prisma.$transaction(async (tx) => {
            const created = await tx.consignment.create({
                data: {
                    code: consignmentCode,
                    consignorId: data.consignorId,
                    consigneeId,
                    status: 'REQUESTED',
                    notes: data.notes,
                    totalQuantity,
                    totalAmount,
                    items: {
                        create: itemsData,
                    },
                },
                include: {
                    items: { include: { product: true } },
                    consignor: { select: { id: true, firstName: true, lastName: true, email: true } },
                    consignee: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
            });
            // Send Notification to Consignor
            await tx.notification.create({
                data: {
                    userId: data.consignorId,
                    title: 'New Product Request from Consignee',
                    message: `Consignee ${created.consignee.firstName} ${created.consignee.lastName} requested ${totalQuantity} items (${consignmentCode})`,
                    type: 'INFO',
                },
            });
            return created;
        });
        return consignment;
    }
    // Consignor dispatches directly
    static async createConsignment(consignorId, data) {
        const consignee = await prisma.user.findUnique({
            where: { id: data.consigneeId },
        });
        if (!consignee || consignee.role !== 'CONSIGNEE') {
            throw new BadRequestError('Invalid consignee user specified');
        }
        let totalQuantity = 0;
        let totalAmount = 0;
        for (const item of data.items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            });
            if (!product) {
                throw new NotFoundError(`Product ${item.productId} not found`);
            }
            if (product.consignorId !== consignorId) {
                throw new ForbiddenError(`Product ${product.name} does not belong to you`);
            }
            if (product.quantity < item.quantity) {
                throw new BadRequestError(`Insufficient stock for product ${product.name}. Available: ${product.quantity}`);
            }
            totalQuantity += item.quantity;
            totalAmount += item.quantity * item.unitPrice;
        }
        const consignmentCode = `CSG-${Date.now().toString().slice(-6)}`;
        const consignment = await prisma.$transaction(async (tx) => {
            const created = await tx.consignment.create({
                data: {
                    code: consignmentCode,
                    consignorId,
                    consigneeId: data.consigneeId,
                    status: 'ACCEPTED',
                    notes: data.notes,
                    totalQuantity,
                    totalAmount,
                    items: {
                        create: data.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                    },
                },
                include: {
                    items: { include: { product: true } },
                    consignor: { select: { firstName: true, lastName: true, email: true } },
                    consignee: { select: { firstName: true, lastName: true, email: true } },
                },
            });
            // Deduct stock immediately for direct consignor dispatch
            for (const item of data.items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (product) {
                    const newQty = product.quantity - item.quantity;
                    await tx.product.update({
                        where: { id: product.id },
                        data: {
                            quantity: newQty,
                            status: newQty === 0 ? 'OUT_OF_STOCK' : product.status,
                        },
                    });
                    await tx.stockMovement.create({
                        data: {
                            productId: product.id,
                            type: 'CONSIGNMENT_OUT',
                            quantity: item.quantity,
                            previousQuantity: product.quantity,
                            newQuantity: newQty,
                            reference: consignmentCode,
                            notes: `Consigned to ${created.consignee.firstName}`,
                            createdById: consignorId,
                        },
                    });
                }
            }
            // Notification
            await tx.notification.create({
                data: {
                    userId: data.consigneeId,
                    title: 'New Consignment Dispatched',
                    message: `Consignment (${consignmentCode}) from ${created.consignor.firstName} has been dispatched to you`,
                    type: 'INFO',
                },
            });
            return created;
        });
        return consignment;
    }
    static async getConsignments(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 100;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.userRole === 'CONSIGNOR') {
            where.consignorId = query.userId;
        }
        else if (query.userRole === 'CONSIGNEE') {
            where.consigneeId = query.userId;
        }
        if (query.status) {
            where.status = query.status;
        }
        const [consignments, total] = await Promise.all([
            prisma.consignment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    consignor: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                    consignee: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                    items: { include: { product: { include: { categories: true, images: true } } } },
                },
            }),
            prisma.consignment.count({ where }),
        ]);
        return {
            consignments,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    static async getConsignmentById(id, userId, userRole) {
        const consignment = await prisma.consignment.findUnique({
            where: { id },
            include: {
                consignor: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                consignee: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                items: { include: { product: { include: { categories: true, images: true } } } },
                returns: true,
            },
        });
        if (!consignment) {
            throw new NotFoundError('Consignment not found');
        }
        if (consignment.consignorId !== userId &&
            consignment.consigneeId !== userId) {
            throw new ForbiddenError('You do not have permission to view this consignment');
        }
        return consignment;
    }
    static async updateConsignmentStatus(id, userId, userRole, status, notes) {
        const consignment = await prisma.consignment.findUnique({
            where: { id },
            include: { items: { include: { product: true } } },
        });
        if (!consignment) {
            throw new NotFoundError('Consignment not found');
        }
        if (userRole === 'CONSIGNOR' && consignment.consignorId !== userId) {
            throw new ForbiddenError('Only the assigned consignor can update this consignment');
        }
        if (consignment.status === status) {
            return consignment;
        }
        return prisma.$transaction(async (tx) => {
            // If Consignor accepts a REQUESTED consignment, reserve and deduct product stock
            if (status === 'ACCEPTED' && consignment.status === 'REQUESTED') {
                for (const item of consignment.items) {
                    const product = item.product;
                    if (product.quantity < item.quantity) {
                        throw new BadRequestError(`Product ${product.name} has insufficient stock to fulfill request`);
                    }
                    const newQty = product.quantity - item.quantity;
                    await tx.product.update({
                        where: { id: product.id },
                        data: {
                            quantity: newQty,
                            status: newQty === 0 ? 'OUT_OF_STOCK' : product.status,
                        },
                    });
                    await tx.stockMovement.create({
                        data: {
                            productId: product.id,
                            type: 'CONSIGNMENT_OUT',
                            quantity: item.quantity,
                            previousQuantity: product.quantity,
                            newQuantity: newQty,
                            reference: consignment.code,
                            notes: `Consignment request accepted & handed over`,
                            createdById: userId,
                        },
                    });
                }
            }
            const updated = await tx.consignment.update({
                where: { id },
                data: {
                    status,
                    ...(notes && { notes }),
                },
                include: {
                    items: true,
                    consignor: { select: { firstName: true, lastName: true, email: true } },
                    consignee: { select: { firstName: true, lastName: true, email: true } },
                },
            });
            // Notify Consignee / Consignor
            const recipientId = userRole === 'CONSIGNOR' ? consignment.consigneeId : consignment.consignorId;
            await tx.notification.create({
                data: {
                    userId: recipientId,
                    title: `Consignment ${status}`,
                    message: `Consignment ${consignment.code} status changed to ${status}`,
                    type: status === 'ACCEPTED' ? 'SUCCESS' : 'INFO',
                },
            });
            return updated;
        });
    }
}
