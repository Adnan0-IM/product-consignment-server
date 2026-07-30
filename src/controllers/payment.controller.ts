import { Response, NextFunction } from 'express'
import { PaymentService } from '../services/payment.service.js'
import { sendSuccess } from '../utils/response.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

export class PaymentController {
  static async createPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentService.createPayment(req.body)
      return sendSuccess(res, 'Payment created successfully', payment, 201)
    } catch (error) {
      next(error)
    }
  }

  static async getPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await PaymentService.getPayments({
        userId: req.user!.userId,
        userRole: req.user!.role,
        ...req.query,
      } as any)
      return sendSuccess(res, 'Payments retrieved successfully', result.payments, 200, result.meta)
    } catch (error) {
      next(error)
    }
  }

  static async updatePaymentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentService.updatePaymentStatus(
        req.params.id,
        req.body.status,
        req.body.notes
      )
      return sendSuccess(res, 'Payment status updated', payment)
    } catch (error) {
      next(error)
    }
  }
}
