import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validate.js'
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/auth.validator.js'

const router = Router()

router.post('/register', validateRequest(registerSchema), AuthController.register)
router.post('/login', validateRequest(loginSchema), AuthController.login)
router.get('/me', authenticate, AuthController.getProfile)
router.put('/profile', authenticate, validateRequest(updateProfileSchema), AuthController.updateProfile)
router.put('/change-password', authenticate, validateRequest(changePasswordSchema), AuthController.changePassword)

export default router
