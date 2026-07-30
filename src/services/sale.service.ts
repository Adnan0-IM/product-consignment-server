import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import { PaymentMethod } from '@prisma/client'

export class SaleService {
  static async recordSale(
    consigneeId: string,
    data: {
      paymentMethod?: PaymentMethod
      customerName?: string
      customerPhone?: string
      notes?: string
      items: Array<{
        productId: string
        quantity: number
      }>
    }
  ) {
    const receiptNumber = `INV-${Date.now().toString().slice(-8)}`
    const paymentMethod = data.paymentMethod || 'CASH'

    // We'll calculate totals and per-item commissions inside a transaction
    return prisma.$transaction(async (tx) => {
      let totalAmount = 0
      let totalConsignorEarnings = 0
      let totalConsigneeEarnings = 0
      let totalAdminEarnings = 0

      const saleItemsToCreate = []
      const commissionsToCreate = []

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { consignor: true },
        })

        if (!product) {
          throw new NotFoundError(`Product ${item.productId} not found`)
        }

        // Check if there is an accepted consignment item for this consignee
        const consignmentItem = await tx.consignmentItem.findFirst({
          where: {
            productId: item.productId,
            consignment: {
              consigneeId,
              status: 'ACCEPTED',
            },
          },
          include: { consignment: true },
        })

        if (!consignmentItem) {
          throw new BadRequestError(
            `No accepted consignment found for product ${product.name} with this consignee`
          )
        }

        const remainingInConsignment =
          consignmentItem.quantity -
          consignmentItem.quantitySold -
          consignmentItem.quantityReturned

        if (remainingInConsignment < item.quantity) {
          throw new BadRequestError(
            `Insufficient consigned quantity for ${product.name}. Available in consignment: ${remainingInConsignment}`
          )
        }

        const unitPrice = Number(product.unitPrice)
        const itemTotalPrice = unitPrice * item.quantity

        // Calculate commission split percentages
        const consignorRate =
          product.consignorRate !== null
            ? Number(product.consignorRate)
            : env.DEFAULT_CONSIGNOR_COMMISSION
        const consigneeRate =
          product.consigneeRate !== null
            ? Number(product.consigneeRate)
            : env.DEFAULT_CONSIGNEE_COMMISSION
        const adminRate = Math.max(0, 100 - (consignorRate + consigneeRate))

        const itemConsignorShare = (itemTotalPrice * consignorRate) / 100
        const itemConsigneeShare = (itemTotalPrice * consigneeRate) / 100
        const itemAdminShare = (itemTotalPrice * adminRate) / 100

        totalAmount += itemTotalPrice
        totalConsignorEarnings += itemConsignorShare
        totalConsigneeEarnings += itemConsigneeShare
        totalAdminEarnings += itemAdminShare

        saleItemsToCreate.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice: itemTotalPrice,
          consignorShare: itemConsignorShare,
          consigneeShare: itemConsigneeShare,
          adminShare: itemAdminShare,
        })

        commissionsToCreate.push({
          consignorId: product.consignorId,
          consigneeId,
          saleAmount: itemTotalPrice,
          consignorShare: itemConsignorShare,
          consigneeShare: itemConsigneeShare,
          adminShare: itemAdminShare,
        })

        // Update consignment item quantity sold
        await tx.consignmentItem.update({
          where: { id: consignmentItem.id },
          data: {
            quantitySold: consignmentItem.quantitySold + item.quantity,
          },
        })

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: 'SALE',
            quantity: item.quantity,
            previousQuantity: product.quantity,
            newQuantity: product.quantity,
            reference: receiptNumber,
            notes: `Sale recorded by consignee (${receiptNumber})`,
            createdById: consigneeId,
          },
        })
      }

      // Create Sale Record
      const sale = await tx.sale.create({
        data: {
          receiptNumber,
          consigneeId,
          totalAmount,
          consignorEarnings: totalConsignorEarnings,
          consigneeEarnings: totalConsigneeEarnings,
          adminEarnings: totalAdminEarnings,
          paymentMethod,
          paymentStatus: 'PAID',
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          notes: data.notes,
          items: {
            create: saleItemsToCreate,
          },
          commissions: {
            create: commissionsToCreate,
          },
        },
        include: {
          items: { include: { product: true } },
          commissions: true,
          consignee: { select: { firstName: true, lastName: true, email: true } },
        },
      })

      // Notify consignors of sales
      const uniqueConsignorIds = [
        ...new Set(saleItemsToCreate.map((item) => {
          const comm = commissionsToCreate.find(c => c.saleAmount === item.totalPrice)
          return comm ? comm.consignorId : null
        })),
      ].filter(Boolean) as string[]

      for (const consignorId of uniqueConsignorIds) {
        await tx.notification.create({
          data: {
            userId: consignorId,
            title: 'Item Sold!',
            message: `One or more of your consigned items were sold under Receipt #${receiptNumber}`,
            type: 'SUCCESS',
          },
        })
      }

      await tx.activityLog.create({
        data: {
          userId: consigneeId,
          action: 'RECORD_SALE',
          entity: 'Sale',
          entityId: sale.id,
          details: `Recorded sale ${receiptNumber} totaling $${totalAmount}`,
        },
      })

      return sale
    })
  }

  static async getSales(query: {
    userId: string
    userRole: string
    consigneeId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10
    const skip = (page - 1) * limit

    const where: any = {}

    if (query.userRole === 'CONSIGNEE') {
      where.consigneeId = query.userId
    } else if (query.consigneeId) {
      where.consigneeId = query.consigneeId
    }

    if (query.userRole === 'CONSIGNOR') {
      where.items = {
        some: {
          product: {
            consignorId: query.userId,
          },
        },
      }
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) where.createdAt.gte = new Date(query.startDate)
      if (query.endDate) where.createdAt.lte = new Date(query.endDate)
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          consignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: { include: { product: true } },
        },
      }),
      prisma.sale.count({ where }),
    ])

    return {
      sales,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getSaleById(id: string) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        consignee: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items: {
          include: {
            product: {
              include: { consignor: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
        },
        commissions: true,
      },
    })

    if (!sale) {
      throw new NotFoundError('Sale receipt not found')
    }

    return sale
  }
}
