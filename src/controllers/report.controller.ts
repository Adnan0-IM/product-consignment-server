import { Response, NextFunction } from 'express'
import { ReportService } from '../services/report.service.js'
import { sendSuccess } from '../utils/response.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

export class ReportController {
  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getDashboard(req.user!.userId, req.user!.role)
      return sendSuccess(res, 'Dashboard metrics retrieved', data)
    } catch (error) {
      next(error)
    }
  }

  static async getSalesReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string }
      const data = await ReportService.getSalesReport(startDate, endDate)
      return sendSuccess(res, 'Sales report generated', data)
    } catch (error) {
      next(error)
    }
  }
}
