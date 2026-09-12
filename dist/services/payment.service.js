import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';
export class PaymentService {
    static async createPayment(data) {
        const payer = await prisma.user.findUnique({ where: { id: data.payerId } });
        if (!payer) {
            throw new NotFoundError('Consignee payer not found');
        }
        const receiver = await prisma.user.findUnique({ where: { id: data.receiverId } });
        if (!receiver) {
            throw new NotFoundError('Consignor recipient not found');
        }
        const reference = `CASH-${Date.now().toString().slice(-8)}`;
        const payment = await prisma.payment.create({
            data: {
                reference,
                payerId: data.payerId,
                receiverId: data.receiverId,
                amount: data.amount,
                category: data.category || 'SETTLEMENT',
                method: 'CASH',
                status: 'PAID',
                notes: data.notes,
            },
            include: {
                payer: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
                receiver: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
            },
        });
        // Send notification to Consignee (payer) that payment was recorded
        await prisma.notification.create({
            data: {
                userId: data.payerId,
                title: 'Cash Payment Recorded',
                message: `Cash payment of ₦${data.amount} (${reference}) recorded by consignor ${payment.receiver.firstName} ${payment.receiver.lastName}`,
                type: 'SUCCESS',
            },
        });
        return payment;
    }
    static async getPayments(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 100;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.userId) {
            where.OR = [{ payerId: query.userId }, { receiverId: query.userId }];
        }
        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    payer: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
                    receiver: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
                },
            }),
            prisma.payment.count({ where }),
        ]);
        return {
            payments,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    static async getPaymentSummary(userId, userRole) {
        let totalSalesValue = 0;
        let totalCashPaid = 0;
        if (userRole === 'CONSIGNEE') {
            // Consignee sales total - what they owe to consignors + admin
            // This is totalSaleAmount - consigneeEarnings (their commission)
            const sales = await prisma.sale.findMany({
                where: { consigneeId: userId },
                select: { totalAmount: true, consigneeEarnings: true },
            });
            // What consignee owes = total amount - their commission (goes to consignors + admin)
            totalSalesValue = sales.reduce((acc, s) => acc + (Number(s.totalAmount) - Number(s.consigneeEarnings)), 0);
            // Payments made by consignee
            const payments = await prisma.payment.findMany({
                where: { payerId: userId, status: 'PAID' },
                select: { amount: true },
            });
            totalCashPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
        }
        else if (userRole === 'CONSIGNOR') {
            // Consignor earnings - what they should receive (their share of sales)
            const commissions = await prisma.commission.findMany({
                where: { consignorId: userId },
                select: { consignorShare: true },
            });
            totalSalesValue = commissions.reduce((acc, c) => acc + Number(c.consignorShare), 0);
            // Payments received by consignor
            const payments = await prisma.payment.findMany({
                where: { receiverId: userId, status: 'PAID' },
                select: { amount: true },
            });
            totalCashPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
        }
        const balance = totalSalesValue - totalCashPaid;
        let paymentStatus = 'UNPAID';
        if (totalCashPaid > totalSalesValue) {
            paymentStatus = 'ADVANCE_CREDIT';
        }
        else if (balance <= 0 && totalSalesValue > 0) {
            paymentStatus = 'PAID';
        }
        else if (totalCashPaid > 0 && totalCashPaid < totalSalesValue) {
            paymentStatus = 'PARTIALLY_PAID';
        }
        else if (totalSalesValue === 0 && totalCashPaid === 0) {
            paymentStatus = 'SETTLED';
        }
        return {
            totalSalesValue,
            totalCashPaid,
            outstandingBalance: Math.max(0, balance),
            advanceAmount: totalCashPaid > totalSalesValue ? totalCashPaid - totalSalesValue : 0,
            paymentStatus,
        };
    }
}
