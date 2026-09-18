import { Router } from 'express';
import { TaskController } from './task.controller';
import { authenticateUser } from '../../middleware/auth';

const router = Router();

// Apply auth middleware to all task routes
router.use(authenticateUser);

router.get('/', TaskController.getAll);
router.post('/', TaskController.create);
router.post('/generate', TaskController.generate);
router.get('/:id', TaskController.getById);
router.patch('/:id', TaskController.update);
router.delete('/:id', TaskController.delete);

export default router;
