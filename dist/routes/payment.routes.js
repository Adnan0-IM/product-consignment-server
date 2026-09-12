import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.use(authenticate);
router.get('/', PaymentController.getPayments);
router.get('/summary', PaymentController.getSummary);
router.post('/', PaymentController.createPayment);
export default router;
