// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticationError } from '../utils/errors';
import { TokenPayload } from '../models/user.model';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AuthenticationError('Authorization header is required');
    }

    // Check that it's a Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AuthenticationError('Authorization header must be in format: Bearer [token]');
    }

    const token = parts[1];

    // Verify the token
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else {
      next(error);
    }
  }
};

// Optional middleware that doesn't require authentication but adds user to request if token exists
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader) {
      // Check that it's a Bearer token
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];

        // Verify the token
        const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
        
        // Add user info to request
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without authentication
    next();
  }
};