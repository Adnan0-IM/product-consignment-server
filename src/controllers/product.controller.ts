import { Response, NextFunction } from 'express'
import { ProductService } from '../services/product.service.js'
import { sendSuccess } from '../utils/response.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

export class ProductController {
  static async getProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = { ...req.query } as any

      // If user is a consignor viewing list without explicit admin override, restrict to own products
      if (req.user?.role === 'CONSIGNOR') {
        query.consignorId = req.user.userId
      }

      const result = await ProductService.getProducts(query)
      return sendSuccess(res, 'Products retrieved successfully', result.products, 200, result.meta)
    } catch (error) {
      next(error)
    }
  }

  static async getProductById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getProductById(req.params.id)
      return sendSuccess(res, 'Product details retrieved', product)
    } catch (error) {
      next(error)
    }
  }

  static async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const consignorId = req.body.consignorId || req.user!.userId
      let imageUrl: string | undefined

      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`
      }

      const product = await ProductService.createProduct(consignorId, {
        ...req.body,
        quantity: req.body.quantity ? Number(req.body.quantity) : 0,
        unitPrice: Number(req.body.unitPrice),
        consignorRate: req.body.consignorRate ? Number(req.body.consignorRate) : undefined,
        consigneeRate: req.body.consigneeRate ? Number(req.body.consigneeRate) : undefined,
        imageUrl,
      })

      return sendSuccess(res, 'Product created successfully', product, 201)
    } catch (error) {
      next(error)
    }
  }

  static async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.updateProduct(
        req.params.id,
        req.user!.userId,
        req.user!.role,
        {
          ...req.body,
          quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : undefined,
          unitPrice: req.body.unitPrice !== undefined ? Number(req.body.unitPrice) : undefined,
        }
      )
      return sendSuccess(res, 'Product updated successfully', product)
    } catch (error) {
      next(error)
    }
  }

  static async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await ProductService.deleteProduct(
        req.params.id,
        req.user!.userId,
        req.user!.role
      )
      return sendSuccess(res, result.message)
    } catch (error) {
      next(error)
    }
  }

  static async uploadImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return sendSuccess(res, 'No image file uploaded', null, 400)
      }
      const imageUrl = `/uploads/${req.file.filename}`
      const isPrimary = req.body.isPrimary === 'true' || req.body.isPrimary === true

      const image = await ProductService.addProductImage(
        req.params.id,
        imageUrl,
        isPrimary
      )
      return sendSuccess(res, 'Product image uploaded successfully', image, 201)
    } catch (error) {
      next(error)
    }
  }
}
