import { prisma } from '../config/prisma.js'
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors.js'
import { ProductStatus } from '@prisma/client'

export class ProductService {
  static async getProducts(query: {
    consignorId?: string
    categoryId?: string
    status?: ProductStatus
    search?: string
    page?: number
    limit?: number
  }) {
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 100
    const skip = (page - 1) * limit

    const where: any = {}

    if (query.consignorId) where.consignorId = query.consignorId
    if (query.categoryId) {
      where.categories = {
        some: { id: query.categoryId },
      }
    }
    if (query.status) where.status = query.status

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: true,
          consignor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          images: true,
        },
      }),
      prisma.product.count({ where }),
    ])

    return {
      products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        consignor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        images: true,
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!product) {
      throw new NotFoundError('Product not found')
    }

    return product
  }

  static async createProduct(
    consignorId: string,
    data: {
      name: string
      description?: string
      categoryId?: string
      categoryIds?: string[]
      sku?: string
      barcode?: string
      quantity?: number
      unitPrice: number
      consignorRate?: number
      consigneeRate?: number
      imageUrl?: string
    }
  ) {
    // Generate SKU if not provided
    const skuToUse = data.sku && data.sku.trim() !== ''
      ? data.sku.trim()
      : `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const existingSku = await prisma.product.findUnique({
      where: { sku: skuToUse },
    })

    if (existingSku) {
      throw new ConflictError('Product with this SKU already exists')
    }

    // Determine category IDs to connect
    let connectCategoryIds: string[] = []
    if (data.categoryIds && Array.isArray(data.categoryIds) && data.categoryIds.length > 0) {
      connectCategoryIds = data.categoryIds
    } else if (data.categoryId) {
      connectCategoryIds = [data.categoryId]
    }

    const initialQuantity = data.quantity || 0

    const product = await prisma.product.create({
      data: {
        consignorId,
        name: data.name,
        description: data.description,
        sku: skuToUse,
        barcode: data.barcode,
        quantity: initialQuantity,
        unitPrice: data.unitPrice,
        consignorRate: data.consignorRate,
        consigneeRate: data.consigneeRate,
        status: initialQuantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
        categories: connectCategoryIds.length > 0
          ? { connect: connectCategoryIds.map((id) => ({ id })) }
          : undefined,
        images: data.imageUrl
          ? {
              create: {
                url: data.imageUrl,
                isPrimary: true,
              },
            }
          : undefined,
      },
      include: {
        categories: true,
        images: true,
      },
    })

    if (initialQuantity > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'RESTOCK',
          quantity: initialQuantity,
          previousQuantity: 0,
          newQuantity: initialQuantity,
          notes: 'Initial stock on product creation',
          createdById: consignorId,
        },
      })
    }

    return product
  }

  static async updateProduct(
    id: string,
    userId: string,
    userRole: string,
    data: {
      name?: string
      description?: string
      categoryId?: string
      categoryIds?: string[]
      sku?: string
      barcode?: string
      quantity?: number
      unitPrice?: number
      consignorRate?: number
      consigneeRate?: number
      status?: ProductStatus
    }
  ) {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) {
      throw new NotFoundError('Product not found')
    }

    if (userRole !== 'ADMIN' && product.consignorId !== userId) {
      throw new ForbiddenError('You can only update your own products')
    }

    if (data.sku && data.sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      })
      if (existingSku) {
        throw new ConflictError('Product with this SKU already exists')
      }
    }

    let categoriesUpdate: any = undefined
    if (data.categoryIds && Array.isArray(data.categoryIds)) {
      categoriesUpdate = {
        set: data.categoryIds.map((catId) => ({ id: catId })),
      }
    } else if (data.categoryId) {
      categoriesUpdate = {
        set: [{ id: data.categoryId }],
      }
    }

    const { categoryId, categoryIds, ...cleanData } = data

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...cleanData,
        categories: categoriesUpdate,
      },
      include: {
        categories: true,
        images: true,
      },
    })

    return updatedProduct
  }

  static async deleteProduct(id: string, userId: string, userRole: string) {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) {
      throw new NotFoundError('Product not found')
    }

    if (userRole !== 'ADMIN' && product.consignorId !== userId) {
      throw new ForbiddenError('You can only delete your own products')
    }

    await prisma.product.delete({ where: { id } })
    return { message: 'Product deleted successfully' }
  }

  static async addProductImage(productId: string, imageUrl: string, isPrimary = false) {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      throw new NotFoundError('Product not found')
    }

    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      })
    }

    return prisma.productImage.create({
      data: {
        productId,
        url: imageUrl,
        isPrimary,
      },
    })
  }
}
