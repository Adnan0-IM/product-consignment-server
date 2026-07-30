import { Router } from 'express'
import { UserController } from '../controllers/user.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', authorize('ADMIN'), UserController.getUsers)
router.get('/:id', authorize('ADMIN'), UserController.getUserById)
router.put('/:id/status', authorize('ADMIN'), UserController.updateUserStatus)
router.put('/:id/role', authorize('ADMIN'), UserController.updateUserRole)
router.delete('/:id', authorize('ADMIN'), UserController.deleteUser)

export default router
