import { Response, NextFunction } from 'express'
import { ReturnService } from '../services/return.service.js'
import { sendSuccess } from '../utils/response.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

export class ReturnController {
  static async createReturn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const returnRecord = await ReturnService.createReturn(req.user!.userId, req.body)
      return sendSuccess(res, 'Return request created successfully', returnRecord, 201)
    } catch (error) {
      next(error)
    }
  }

  static async getReturns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await ReturnService.getReturns({
        userId: req.user!.userId,
        userRole: req.user!.role,
        ...req.query,
      } as any)
      return sendSuccess(res, 'Returns list retrieved', result.returns, 200, result.meta)
    } catch (error) {
      next(error)
    }
  }

  static async updateReturnStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await ReturnService.updateReturnStatus(
        req.params.id,
        req.user!.userId,
        req.body.status
      )
      return sendSuccess(res, 'Return status updated', updated)
    } catch (error) {
      next(error)
    }
  }
}
