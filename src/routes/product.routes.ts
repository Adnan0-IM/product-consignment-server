import { Router } from 'express'
import { ProductController } from '../controllers/product.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

router.get('/', ProductController.getProducts)
router.get('/:id', ProductController.getProductById)

router.use(authenticate)

router.post(
  '/',
  authorize('ADMIN', 'CONSIGNOR'),
  upload.single('image'),
  ProductController.createProduct
)

router.put(
  '/:id',
  authorize('ADMIN', 'CONSIGNOR'),
  ProductController.updateProduct
)

router.delete(
  '/:id',
  authorize('ADMIN', 'CONSIGNOR'),
  ProductController.deleteProduct
)

router.post(
  '/:id/images',
  authorize('ADMIN', 'CONSIGNOR'),
  upload.single('image'),
  ProductController.uploadImage
)

export default router
