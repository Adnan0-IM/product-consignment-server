import { Response, NextFunction } from 'express'
import { CommissionService } from '../services/commission.service.js'
import { sendSuccess } from '../utils/response.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

export class CommissionController {
  static async getCommissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await CommissionService.getCommissions({
        userId: req.user!.userId,
        userRole: req.user!.role,
        ...req.query,
      } as any)
      return sendSuccess(res, 'Commissions retrieved successfully', result.commissions, 200, result.meta)
    } catch (error) {
      next(error)
    }
  }

  static async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const summary = await CommissionService.getCommissionSummary(
        req.user!.userId,
        req.user!.role
      )
      return sendSuccess(res, 'Commission summary retrieved', summary)
    } catch (error) {
      next(error)
    }
  }
}
