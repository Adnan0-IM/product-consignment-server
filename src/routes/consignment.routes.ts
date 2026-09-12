import { Router } from 'express'
import { ConsignmentController } from '../controllers/consignment.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', ConsignmentController.getConsignments)
router.get('/:id', ConsignmentController.getConsignmentById)

router.post(
  '/request',
  authorize('CONSIGNEE'),
  ConsignmentController.requestConsignment
)

router.post(
  '/',
  authorize('CONSIGNOR'),
  ConsignmentController.createConsignment
)

router.put(
  '/:id/status',
  ConsignmentController.updateStatus
)

export default router
