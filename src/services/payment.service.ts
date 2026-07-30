import { prisma } from '../config/prisma.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import { PaymentMethod, PaymentStatus, PaymentType } from '@prisma/client'

export class PaymentService {
  static async createPayment(data: {
    userId: string
    amount: number
    type?: PaymentType
    method?: PaymentMethod
    notes?: string
  }) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } })
    if (!user) {
      throw new NotFoundError('User not found')
    }

    const reference = `PAY-${Date.now().toString().slice(-8)}`

    const payment = await prisma.payment.create({
      data: {
        reference,
        userId: data.userId,
        amount: data.amount,
        type: data.type || 'CONSIGNOR_PAYOUT',
        method: data.method || 'TRANSFER',
        status: 'PENDING',
        notes: data.notes,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, role: true } },
      },
    })

    await prisma.notification.create({
      data: {
        userId: data.userId,
        title: 'Payment Processed / Initiated',
        message: `A payment request of $${data.amount} (${reference}) has been initiated.`,
        type: 'INFO',
      },
    })

    return payment
  }

  static async getPayments(query: {
    userId?: string
    userRole?: string
    status?: PaymentStatus
    type?: PaymentType
    page?: number
    limit?: number
  }) {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10
    const skip = (page - 1) * limit

    const where: any = {}

    if (query.userRole !== 'ADMIN' && query.userId) {
      where.userId = query.userId
    } else if (query.userId) {
      where.userId = query.userId
    }

    if (query.status) where.status = query.status
    if (query.type) where.type = query.type

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        },
      }),
      prisma.payment.count({ where }),
    ])

    return {
      payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    notes?: string
  ) {
    const payment = await prisma.payment.findUnique({ where: { id } })
    if (!payment) {
      throw new NotFoundError('Payment record not found')
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status,
        ...(notes && { notes }),
        processedAt: status === 'PAID' ? new Date() : payment.processedAt,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    if (status === 'PAID') {
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payout Completed',
          message: `Your payment of $${payment.amount} (Ref: ${payment.reference}) has been marked as PAID.`,
          type: 'SUCCESS',
        },
      })
    }

    return updated
  }
}
