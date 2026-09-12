import { Router } from 'express'
import { InventoryController } from '../controllers/inventory.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/overview', InventoryController.getOverview)
router.get('/movements', InventoryController.getStockMovements)

router.post(
  '/:id/adjust',
  authorize('CONSIGNOR'),
  InventoryController.adjustStock
)

export default router
