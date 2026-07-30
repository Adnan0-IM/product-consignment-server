import { prisma } from '../config/prisma.js'

export class ReportService {
  static async getDashboard(userId: string, role: string) {
    if (role === 'ADMIN') {
      const [
        totalUsers,
        totalConsignors,
        totalConsignees,
        totalProducts,
        totalSales,
        totalRevenue,
        pendingConsignments,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'CONSIGNOR' } }),
        prisma.user.count({ where: { role: 'CONSIGNEE' } }),
        prisma.product.count(),
        prisma.sale.count(),
        prisma.sale.aggregate({ _sum: { totalAmount: true, adminEarnings: true } }),
        prisma.consignment.count({ where: { status: 'PENDING' } }),
      ])

      const recentSales = await prisma.sale.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          consignee: { select: { firstName: true, lastName: true } },
        },
      })

      return {
        role: 'ADMIN',
        metrics: {
          totalUsers,
          totalConsignors,
          totalConsignees,
          totalProducts,
          totalSales,
          totalGrossVolume: Number(totalRevenue._sum.totalAmount || 0),
          totalPlatformRevenue: Number(totalRevenue._sum.adminEarnings || 0),
          pendingConsignments,
        },
        recentSales,
      }
    }

    if (role === 'CONSIGNOR') {
      const [
        myProductsCount,
        myConsignmentsCount,
        mySalesCount,
        myEarningsAgg,
        recentConsignments,
      ] = await Promise.all([
        prisma.product.count({ where: { consignorId: userId } }),
        prisma.consignment.count({ where: { consignorId: userId } }),
        prisma.saleItem.count({
          where: { product: { consignorId: userId } },
        }),
        prisma.commission.aggregate({
          where: { consignorId: userId },
          _sum: { consignorShare: true, saleAmount: true },
        }),
        prisma.consignment.findMany({
          where: { consignorId: userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            consignee: { select: { firstName: true, lastName: true } },
          },
        }),
      ])

      return {
        role: 'CONSIGNOR',
        metrics: {
          totalProducts: myProductsCount,
          totalConsignments: myConsignmentsCount,
          totalItemsSold: mySalesCount,
          totalSalesValue: Number(myEarningsAgg._sum.saleAmount || 0),
          totalEarned: Number(myEarningsAgg._sum.consignorShare || 0),
        },
        recentConsignments,
      }
    }

    // CONSIGNEE Dashboard
    const [
      assignedConsignments,
      acceptedConsignments,
      mySalesCount,
      myEarningsAgg,
      recentSales,
    ] = await Promise.all([
      prisma.consignment.count({ where: { consigneeId: userId } }),
      prisma.consignment.count({ where: { consigneeId: userId, status: 'ACCEPTED' } }),
      prisma.sale.count({ where: { consigneeId: userId } }),
      prisma.commission.aggregate({
        where: { consigneeId: userId },
        _sum: { consigneeShare: true, saleAmount: true },
      }),
      prisma.sale.findMany({
        where: { consigneeId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return {
      role: 'CONSIGNEE',
      metrics: {
        totalConsignmentsReceived: assignedConsignments,
        activeConsignments: acceptedConsignments,
        totalSalesRecorded: mySalesCount,
        totalSalesValue: Number(myEarningsAgg._sum.saleAmount || 0),
        totalCommissionEarned: Number(myEarningsAgg._sum.consigneeShare || 0),
      },
      recentSales,
    }
  }

  static async getSalesReport(startDate?: string, endDate?: string) {
    const where: any = {}
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        consignee: { select: { firstName: true, lastName: true, email: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    })

    const totals = await prisma.sale.aggregate({
      where,
      _sum: {
        totalAmount: true,
        consignorEarnings: true,
        consigneeEarnings: true,
        adminEarnings: true,
      },
      _count: { id: true },
    })

    return {
      summary: {
        totalSalesCount: totals._count.id,
        totalGrossVolume: Number(totals._sum.totalAmount || 0),
        totalConsignorEarnings: Number(totals._sum.consignorEarnings || 0),
        totalConsigneeEarnings: Number(totals._sum.consigneeEarnings || 0),
        totalAdminEarnings: Number(totals._sum.adminEarnings || 0),
      },
      sales,
    }
  }
}
