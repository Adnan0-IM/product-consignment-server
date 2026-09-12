import { Router } from 'express';
import { CommissionController } from '../controllers/commission.controller.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.use(authenticate);
router.get('/', CommissionController.getCommissions);
router.get('/summary', CommissionController.getSummary);
export default router;
