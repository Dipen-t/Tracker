import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input',
      errors: err.issues,
    });
  }

  // Handle standard HTTP errors if we throw custom objects
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Fallback for unexpected internal errors
  res.status(500).json({
    success: false,
    message: err?.message || 'Something went wrong.',
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
  });
};
