import { prisma } from '../config/prisma.js'
import { NotFoundError, BadRequestError } from '../utils/errors.js'
import { ReturnStatus } from '@prisma/client'

export class ReturnService {
  static async createReturn(
    requestedBy: string,
    data: {
      productId: string
      consignmentId?: string
      quantity: number
      reason: string
    }
  ) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    })

    if (!product) {
      throw new NotFoundError('Product not found')
    }

    const returnNumber = `RET-${Date.now().toString().slice(-8)}`

    const returnRecord = await prisma.return.create({
      data: {
        returnNumber,
        productId: data.productId,
        consignmentId: data.consignmentId,
        quantity: data.quantity,
        reason: data.reason,
        status: 'PENDING',
        requestedBy,
      },
      include: {
        product: { select: { name: true, sku: true } },
      },
    })

    return returnRecord
  }

  static async getReturns(query: {
    requestedBy?: string
    status?: ReturnStatus
    page?: number
    limit?: number
  }) {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10
    const skip = (page - 1) * limit

    const where: any = {}
    if (query.requestedBy) where.requestedBy = query.requestedBy
    if (query.status) where.status = query.status

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          consignment: true,
        },
      }),
      prisma.return.count({ where }),
    ])

    return {
      returns,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async updateReturnStatus(
    id: string,
    processedBy: string,
    status: ReturnStatus
  ) {
    const returnRecord = await prisma.return.findUnique({
      where: { id },
      include: { product: true },
    })

    if (!returnRecord) {
      throw new NotFoundError('Return record not found')
    }

    if (returnRecord.status === status) {
      return returnRecord
    }

    return prisma.$transaction(async (tx) => {
      // If APPROVED or COMPLETED, restock product back into available inventory
      if ((status === 'APPROVED' || status === 'COMPLETED') && returnRecord.status === 'PENDING') {
        const product = returnRecord.product
        const newQty = product.quantity + returnRecord.quantity

        await tx.product.update({
          where: { id: product.id },
          data: {
            quantity: newQty,
            status: 'AVAILABLE',
          },
        })

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: 'RETURN',
            quantity: returnRecord.quantity,
            previousQuantity: product.quantity,
            newQuantity: newQty,
            reference: returnRecord.returnNumber,
            notes: `Stock restocked from Return #${returnRecord.returnNumber}`,
            createdById: processedBy,
          },
        })
      }

      const updated = await tx.return.update({
        where: { id },
        data: {
          status,
          processedBy,
        },
        include: { product: true },
      })

      return updated
    })
  }
}
