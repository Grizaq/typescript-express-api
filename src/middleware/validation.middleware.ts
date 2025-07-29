// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

export const validateTodoCreate = (req: Request, res: Response, next: NextFunction): void => {
  const { title, description, dueDate, priority, imageUrls, tags } = req.body;
  
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
  
  // Optional field validations
  if (description !== undefined && typeof description !== 'string') {
    next(new ValidationError('Description must be a string'));
    return;
  }
  
  if (dueDate !== undefined) {
    const dateObj = new Date(dueDate);
    if (isNaN(dateObj.getTime())) {
      next(new ValidationError('Due date must be a valid date'));
      return;
    }
  }
  
  if (priority !== undefined && (typeof priority !== 'number' || priority < 1 || priority > 5)) {
    next(new ValidationError('Priority must be a number between 1 and 5'));
    return;
  }
  
  if (imageUrls !== undefined && !Array.isArray(imageUrls)) {
    next(new ValidationError('Image URLs must be an array'));
    return;
  }
  
  if (tags !== undefined && !Array.isArray(tags)) {
    next(new ValidationError('Tags must be an array'));
    return;
  }
  
  next();
};

export const validateTodoUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { title, description, completed, dueDate, priority, imageUrls, tags } = req.body;
  
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
  
  if (description !== undefined && typeof description !== 'string') {
    next(new ValidationError('Description must be a string'));
    return;
  }
  
  if (completed !== undefined && typeof completed !== 'boolean') {
    next(new ValidationError('Completed status must be a boolean'));
    return;
  }
  
  if (dueDate !== undefined) {
    const dateObj = new Date(dueDate);
    if (isNaN(dateObj.getTime())) {
      next(new ValidationError('Due date must be a valid date'));
      return;
    }
  }
  
  if (priority !== undefined && (typeof priority !== 'number' || priority < 1 || priority > 5)) {
    next(new ValidationError('Priority must be a number between 1 and 5'));
    return;
  }
  
  if (imageUrls !== undefined && !Array.isArray(imageUrls)) {
    next(new ValidationError('Image URLs must be an array'));
    return;
  }
  
  if (tags !== undefined && !Array.isArray(tags)) {
    next(new ValidationError('Tags must be an array'));
    return;
  }
  
  next();
};