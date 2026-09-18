import app from './app';
import { env } from './config/env';
import { db } from './db';

const startServer = async () => {
  try {
    // Ensure database connection works by running a simple query (e.g., getting current time)
    // Note: Drizzle itself doesn't have an explicit 'connect' method that throws if it can't connect,
    // so it connects lazily. But if needed we can await a simple dummy query here.

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
