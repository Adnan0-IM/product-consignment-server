import { Router } from 'express'
import { ActivityLogController } from '../controllers/activityLog.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

router.get('/', ActivityLogController.getActivityLogs)

export default router
