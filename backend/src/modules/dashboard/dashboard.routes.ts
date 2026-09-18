import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticateUser } from '../../middleware/auth';

const router = Router();

// Apply auth middleware to all dashboard routes
router.use(authenticateUser);

router.get('/summary', DashboardController.getSummary);
router.get('/chart', DashboardController.getChartData);
router.get('/analytics', DashboardController.getAnalytics);

export default router;
