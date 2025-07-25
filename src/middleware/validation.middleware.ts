import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

export const validateTodoCreate = (req: Request, res: Response, next: NextFunction): void => {
  const { title } = req.body;
  
  if (!title) {
    next(new ValidationError('Title is required'));
    return;
  }
  
  if (typeof title !== 'string') {
    next(new ValidationError('Title must be a string'));
    return;
  }
  
  if (title.trim().length < 3) {
    next(new ValidationError('Title must be at least 3 characters long'));
    return;
  }
  
  next();
};

export const validateTodoUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { title, completed } = req.body;
  
  if (title !== undefined) {
    if (typeof title !== 'string') {
      next(new ValidationError('Title must be a string'));
      return;
    }
    
    if (title.trim().length < 3) {
      next(new ValidationError('Title must be at least 3 characters long'));
      return;
    }
  }
  
  if (completed !== undefined && typeof completed !== 'boolean') {
    next(new ValidationError('Completed status must be a boolean'));
    return;
  }
  
  next();
};