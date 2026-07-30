import { Router } from 'express'
import { ReportController } from '../controllers/report.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/dashboard', ReportController.getDashboard)
router.get('/sales', authorize('ADMIN'), ReportController.getSalesReport)

export default router
