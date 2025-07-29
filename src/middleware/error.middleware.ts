// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error | AppError, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  console.error(`Error: ${err.message}`);
  
  // Check if error is one of our custom errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
    return;
  }
  
  // Handle unexpected errors
  res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
};