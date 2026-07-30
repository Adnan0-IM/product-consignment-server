import { Response, NextFunction } from 'express'
import { UserService } from '../services/user.service.js'
import { sendSuccess } from '../utils/response.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

export class UserController {
  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getUsers(req.query as any)
      return sendSuccess(res, 'Users retrieved successfully', result.users, 200, result.meta)
    } catch (error) {
      next(error)
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getUserById(req.params.id)
      return sendSuccess(res, 'User details retrieved', user)
    } catch (error) {
      next(error)
    }
  }

  static async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.updateUserStatus(req.params.id, req.body.status)
      return sendSuccess(res, 'User status updated', user)
    } catch (error) {
      next(error)
    }
  }

  static async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.updateUserRole(req.params.id, req.body.role)
      return sendSuccess(res, 'User role updated', user)
    } catch (error) {
      next(error)
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.deleteUser(req.params.id)
      return sendSuccess(res, result.message)
    } catch (error) {
      next(error)
    }
  }
}
