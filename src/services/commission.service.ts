import { prisma } from '../config/prisma.js'

export class CommissionService {
  static async getCommissions(query: {
    userId: string
    userRole: string
    page?: number
    limit?: number
  }) {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 100
    const skip = (page - 1) * limit

    const where: any = {}

    if (query.userRole === 'CONSIGNOR') {
      where.consignorId = query.userId
    } else if (query.userRole === 'CONSIGNEE') {
      where.consigneeId = query.userId
    }

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sale: { select: { id: true, receiptNumber: true, createdAt: true } },
          consignor: { select: { id: true, firstName: true, lastName: true, email: true } },
          consignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.commission.count({ where }),
    ])

    return {
      commissions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getCommissionSummary(userId: string, userRole: string) {
    if (userRole === 'CONSIGNOR') {
      const commissions = await prisma.commission.aggregate({
        where: { consignorId: userId },
        _sum: { consignorShare: true, saleAmount: true },
      })

      const paidPayments = await prisma.payment.aggregate({
        where: { receiverId: userId, status: 'PAID' },
        _sum: { amount: true },
      })

      const totalEarned = Number(commissions._sum.consignorShare || 0)
      const totalPaid = Number(paidPayments._sum?.amount || 0)
      const outstandingBalance = Math.max(0, totalEarned - totalPaid)

      return {
        role: 'CONSIGNOR',
        totalSalesAmount: Number(commissions._sum.saleAmount || 0),
        totalEarned,
        totalPaidOut: totalPaid,
        pendingPayout: 0,
        outstandingBalance,
      }
    }

    // CONSIGNEE Summary
    const commissions = await prisma.commission.aggregate({
      where: { consigneeId: userId },
      _sum: { consigneeShare: true, saleAmount: true },
    })

    const paidPayments = await prisma.payment.aggregate({
      where: { payerId: userId, status: 'PAID' },
      _sum: { amount: true },
    })

    return {
      role: 'CONSIGNEE',
      totalSalesAmount: Number(commissions._sum.saleAmount || 0),
      totalCommissionEarned: Number(commissions._sum.consigneeShare || 0),
      totalPaidOut: Number(paidPayments._sum?.amount || 0),
    }
  }
}
