import { Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service.js'
import { sendSuccess } from '../utils/response.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body)
      return sendSuccess(res, 'User registered successfully', result, 201)
    } catch (error) {
      next(error)
    }
  }

  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body)
      return sendSuccess(res, 'Login successful', result)
    } catch (error) {
      next(error)
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getProfile(req.user!.userId)
      return sendSuccess(res, 'User profile fetched successfully', user)
    } catch (error) {
      next(error)
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.updateProfile(req.user!.userId, req.body)
      return sendSuccess(res, 'Profile updated successfully', user)
    } catch (error) {
      next(error)
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.changePassword(req.user!.userId, req.body)
      return sendSuccess(res, result.message)
    } catch (error) {
      next(error)
    }
  }
}
