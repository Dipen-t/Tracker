import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import taskRoutes from './modules/tasks/task.routes';
import timeRoutes from './modules/time/time.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Register module routes here
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', timeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
