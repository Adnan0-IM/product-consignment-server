import { prisma } from '../config/prisma.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js'
import { ConsignmentStatus } from '@prisma/client'

export class ConsignmentService {
  static async createConsignment(
    consignorId: string,
    data: {
      consigneeId: string
      notes?: string
      items: Array<{
        productId: string
        quantity: number
        unitPrice: number
      }>
    }
  ) {
    const consignee = await prisma.user.findUnique({
      where: { id: data.consigneeId },
    })

    if (!consignee || consignee.role !== 'CONSIGNEE') {
      throw new BadRequestError('Invalid consignee user specified')
    }

    let totalQuantity = 0
    let totalAmount = 0

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })
      if (!product) {
        throw new NotFoundError(`Product ${item.productId} not found`)
      }
      if (product.consignorId !== consignorId) {
        throw new ForbiddenError(`Product ${product.name} does not belong to you`)
      }
      if (product.quantity < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for product ${product.name}. Available: ${product.quantity}`
        )
      }

      totalQuantity += item.quantity
      totalAmount += item.quantity * item.unitPrice
    }

    const consignmentCode = `CSG-${Date.now().toString().slice(-6)}`

    const consignment = await prisma.$transaction(async (tx) => {
      const created = await tx.consignment.create({
        data: {
          code: consignmentCode,
          consignorId,
          consigneeId: data.consigneeId,
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
      })

      // Send Notification to Consignee
      await tx.notification.create({
        data: {
          userId: data.consigneeId,
          title: 'New Consignment Received',
          message: `You have received a new consignment (${consignmentCode}) from ${created.consignor.firstName} ${created.consignor.lastName}`,
          type: 'INFO',
        },
      })

      return created
    })

    return consignment
  }

  static async getConsignments(query: {
    userId: string
    userRole: string
    status?: ConsignmentStatus
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

    if (query.status) {
      where.status = query.status
    }

    const [consignments, total] = await Promise.all([
      prisma.consignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          consignor: { select: { id: true, firstName: true, lastName: true, email: true } },
          consignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: { include: { product: true } },
        },
      }),
      prisma.consignment.count({ where }),
    ])

    return {
      consignments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getConsignmentById(id: string, userId: string, userRole: string) {
    const consignment = await prisma.consignment.findUnique({
      where: { id },
      include: {
        consignor: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        consignee: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items: { include: { product: { include: { category: true, images: true } } } },
        returns: true,
      },
    })

    if (!consignment) {
      throw new NotFoundError('Consignment not found')
    }

    if (
      userRole !== 'ADMIN' &&
      consignment.consignorId !== userId &&
      consignment.consigneeId !== userId
    ) {
      throw new ForbiddenError('You do not have permission to view this consignment')
    }

    return consignment
  }

  static async updateConsignmentStatus(
    id: string,
    userId: string,
    userRole: string,
    status: ConsignmentStatus,
    notes?: string
  ) {
    const consignment = await prisma.consignment.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    })

    if (!consignment) {
      throw new NotFoundError('Consignment not found')
    }

    if (userRole === 'CONSIGNEE' && consignment.consigneeId !== userId) {
      throw new ForbiddenError('Only the assigned consignee can accept or reject this consignment')
    }

    if (consignment.status === status) {
      return consignment
    }

    return prisma.$transaction(async (tx) => {
      // If ACCEPTED, transfer/reserve stock movement
      if (status === 'ACCEPTED' && consignment.status === 'PENDING') {
        for (const item of consignment.items) {
          const product = item.product
          if (product.quantity < item.quantity) {
            throw new BadRequestError(`Product ${product.name} has insufficient stock to fulfill consignment`)
          }

          const newQty = product.quantity - item.quantity

          await tx.product.update({
            where: { id: product.id },
            data: {
              quantity: newQty,
              status: newQty === 0 ? 'OUT_OF_STOCK' : product.status,
            },
          })

          await tx.stockMovement.create({
            data: {
              productId: product.id,
              type: 'CONSIGNMENT_OUT',
              quantity: item.quantity,
              previousQuantity: product.quantity,
              newQuantity: newQty,
              reference: consignment.code,
              notes: `Consigned to consignee (Consignment: ${consignment.code})`,
              createdById: userId,
            },
          })
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
      })

      // Notify Consignor
      await tx.notification.create({
        data: {
          userId: consignment.consignorId,
          title: `Consignment ${status}`,
          message: `Consignment ${consignment.code} status changed to ${status}`,
          type: status === 'ACCEPTED' ? 'SUCCESS' : 'WARNING',
        },
      })

      return updated
    })
  }
}
