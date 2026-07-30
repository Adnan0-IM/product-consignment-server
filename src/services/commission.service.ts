import { prisma } from '../config/prisma.js'

export class CommissionService {
  static async getCommissions(query: {
    userId: string
    userRole: string
    page?: number
    limit?: number
  }) {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10
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
        where: { userId, status: 'PAID', type: 'CONSIGNOR_PAYOUT' },
        _sum: { amount: true },
      })

      const pendingPayments = await prisma.payment.aggregate({
        where: { userId, status: 'PENDING', type: 'CONSIGNOR_PAYOUT' },
        _sum: { amount: true },
      })

      const totalEarned = Number(commissions._sum.consignorShare || 0)
      const totalPaid = Number(paidPayments._sum.amount || 0)
      const totalPendingPayout = Number(pendingPayments._sum.amount || 0)
      const outstandingBalance = Math.max(0, totalEarned - totalPaid)

      return {
        role: 'CONSIGNOR',
        totalSalesAmount: Number(commissions._sum.saleAmount || 0),
        totalEarned,
        totalPaidOut: totalPaid,
        pendingPayout: totalPendingPayout,
        outstandingBalance,
      }
    }

    if (userRole === 'CONSIGNEE') {
      const commissions = await prisma.commission.aggregate({
        where: { consigneeId: userId },
        _sum: { consigneeShare: true, saleAmount: true },
      })

      return {
        role: 'CONSIGNEE',
        totalSalesAmount: Number(commissions._sum.saleAmount || 0),
        totalCommissionEarned: Number(commissions._sum.consigneeShare || 0),
      }
    }

    // ADMIN summary
    const [allCommissions, allPaidPayouts] = await Promise.all([
      prisma.commission.aggregate({
        _sum: {
          saleAmount: true,
          consignorShare: true,
          consigneeShare: true,
          adminShare: true,
        },
      }),
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
    ])

    return {
      role: 'ADMIN',
      totalGrossSales: Number(allCommissions._sum.saleAmount || 0),
      totalConsignorEarnings: Number(allCommissions._sum.consignorShare || 0),
      totalConsigneeEarnings: Number(allCommissions._sum.consigneeShare || 0),
      totalAdminPlatformRevenue: Number(allCommissions._sum.adminShare || 0),
      totalPayoutsDisbursed: Number(allPaidPayouts._sum.amount || 0),
    }
  }
}
