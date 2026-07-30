import { Router } from 'express'
import { CategoryController } from '../controllers/category.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.get('/', CategoryController.getCategories)
router.get('/:id', CategoryController.getCategoryById)

router.use(authenticate, authorize('ADMIN'))
router.post('/', CategoryController.createCategory)
router.put('/:id', CategoryController.updateCategory)
router.delete('/:id', CategoryController.deleteCategory)

export default router
