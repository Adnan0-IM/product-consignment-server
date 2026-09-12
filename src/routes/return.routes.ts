import { Router } from 'express'
import { ReturnController } from '../controllers/return.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validate.js'
import {
  createReturnSchema,
  updateReturnStatusSchema,
} from '../validators/return.validator.js'

const router = Router()

router.use(authenticate)

router.get('/', ReturnController.getReturns)
router.post(
  '/',
  validateRequest(createReturnSchema),
  ReturnController.createReturn
)

router.put(
  '/:id/status',
  authorize('CONSIGNOR'),
  validateRequest(updateReturnStatusSchema),
  ReturnController.updateReturnStatus
)

export default router
