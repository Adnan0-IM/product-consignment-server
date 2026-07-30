import { Response, NextFunction } from 'express'
import { CategoryService } from '../services/category.service.js'
import { sendSuccess } from '../utils/response.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

export class CategoryController {
  static async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getCategories()
      return sendSuccess(res, 'Categories retrieved successfully', categories)
    } catch (error) {
      next(error)
    }
  }

  static async getCategoryById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id)
      return sendSuccess(res, 'Category details retrieved', category)
    } catch (error) {
      next(error)
    }
  }

  static async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.createCategory(req.body)
      return sendSuccess(res, 'Category created successfully', category, 201)
    } catch (error) {
      next(error)
    }
  }

  static async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body)
      return sendSuccess(res, 'Category updated successfully', category)
    } catch (error) {
      next(error)
    }
  }

  static async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await CategoryService.deleteCategory(req.params.id)
      return sendSuccess(res, result.message)
    } catch (error) {
      next(error)
    }
  }
}
