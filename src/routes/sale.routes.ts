import { Router } from 'express'
import { SaleController } from '../controllers/sale.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validate.js'
import { createSaleSchema } from '../validators/sale.validator.js'

const router = Router()

router.use(authenticate)

router.get('/', SaleController.getSales)
router.get('/:id', SaleController.getSaleById)

router.post(
  '/',
  authorize('CONSIGNEE'),
  validateRequest(createSaleSchema),
  SaleController.recordSale
)

export default router
