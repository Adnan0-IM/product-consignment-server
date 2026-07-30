import { Response, NextFunction } from 'express'
import { NotificationService } from '../services/notification.service.js'
import { sendSuccess } from '../utils/response.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

export class NotificationController {
  static async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await NotificationService.getNotifications(req.user!.userId)
      return sendSuccess(res, 'Notifications retrieved', notifications)
    } catch (error) {
      next(error)
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAsRead(req.params.id, req.user!.userId)
      return sendSuccess(res, 'Notification marked as read')
    } catch (error) {
      next(error)
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAllAsRead(req.user!.userId)
      return sendSuccess(res, 'All notifications marked as read')
    } catch (error) {
      next(error)
    }
  }
}
