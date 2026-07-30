import { Router } from 'express'
import { ConsignmentController } from '../controllers/consignment.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validate.js'
import {
  createConsignmentSchema,
  updateConsignmentStatusSchema,
} from '../validators/consignment.validator.js'

const router = Router()

router.use(authenticate)

router.get('/', ConsignmentController.getConsignments)
router.get('/:id', ConsignmentController.getConsignmentById)

router.post(
  '/',
  authorize('ADMIN', 'CONSIGNOR'),
  validateRequest(createConsignmentSchema),
  ConsignmentController.createConsignment
)

router.put(
  '/:id/status',
  authorize('ADMIN', 'CONSIGNEE'),
  validateRequest(updateConsignmentStatusSchema),
  ConsignmentController.updateStatus
)

export default router
