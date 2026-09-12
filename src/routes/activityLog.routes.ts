import { Router } from 'express'
import { ActivityLogController } from '../controllers/activityLog.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', ActivityLogController.getActivityLogs)

export default router
