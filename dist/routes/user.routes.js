import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.use(authenticate);
router.get('/', UserController.getUsers);
router.get('/:id', UserController.getUserById);
export default router;
