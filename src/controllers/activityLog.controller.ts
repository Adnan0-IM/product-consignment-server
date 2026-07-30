import { Response, NextFunction } from 'express'
import { ActivityLogService } from '../services/activityLog.service.js'
import { sendSuccess } from '../utils/response.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

export class ActivityLogController {
  static async getActivityLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await ActivityLogService.getActivityLogs(req.query as any)
      return sendSuccess(res, 'Activity logs retrieved', result.logs, 200, result.meta)
    } catch (error) {
      next(error)
    }
  }
}
