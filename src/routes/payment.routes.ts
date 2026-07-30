import { Router } from 'express'
import { PaymentController } from '../controllers/payment.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validate.js'
import {
  createPaymentSchema,
  updatePaymentStatusSchema,
} from '../validators/payment.validator.js'

const router = Router()

router.use(authenticate)

router.get('/', PaymentController.getPayments)

router.post(
  '/',
  authorize('ADMIN'),
  validateRequest(createPaymentSchema),
  PaymentController.createPayment
)

router.put(
  '/:id/status',
  authorize('ADMIN'),
  validateRequest(updatePaymentStatusSchema),
  PaymentController.updatePaymentStatus
)

export default router
