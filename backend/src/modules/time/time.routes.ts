import { Router } from 'express';
import { TimeController } from './time.controller';
import { authenticateUser } from '../../middleware/auth';

const router = Router();

// Apply auth middleware to all time routes
router.use(authenticateUser);

router.get('/time-logs', TimeController.getAllLogs);
router.get('/time/active', TimeController.getActive);
router.post('/tasks/:id/time/start', TimeController.start);
router.post('/tasks/:id/time/stop', TimeController.stop);
router.get('/tasks/:id/time-logs', TimeController.getLogs);
router.get('/tasks/:id/time-total', TimeController.getTotal);

export default router;
