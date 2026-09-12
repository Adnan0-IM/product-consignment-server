import { Response, NextFunction } from 'express'
import { PaymentService } from '../services/payment.service.js'
import { sendSuccess } from '../utils/response.js'
import { AuthenticatedRequest } from '../middleware/auth.js'

import { ForbiddenError, BadRequestError } from '../utils/errors.js'

export class PaymentController {
  static async createPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== 'CONSIGNOR') {
        throw new ForbiddenError('Only consignors can record cash payments')
      }

      const consignorId = req.user!.userId
      const payerId = req.body.payerId || req.body.receiverId

      if (!payerId) {
        throw new BadRequestError('Consignee (payer) ID is required')
      }

      const payment = await PaymentService.createPayment({
        payerId,
        receiverId: consignorId,
        amount: Number(req.body.amount),
        category: req.body.category,
        notes: req.body.notes,
      })
      return sendSuccess(res, 'Cash payment recorded successfully', payment, 201)
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

  static async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const summary = await PaymentService.getPaymentSummary(
        req.user!.userId,
        req.user!.role
      )
      return sendSuccess(res, 'Payment summary retrieved', summary)
    } catch (error) {
      next(error)
    }
  }
}
