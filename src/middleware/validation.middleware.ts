// src/middleware/validation.middleware.ts
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
  
  if (imageUrls !== undefined && !Array.isArray(imageUrls)) {
    next(new ValidationError('Image URLs must be an array'));
    return;
  }
  
  if (tags !== undefined && !Array.isArray(tags)) {
    next(new ValidationError('Tags must be an array'));
    return;
  }

  if (priority !== undefined && 
      !['low', 'medium', 'high', 'urgent', 'critical'].includes(priority)) {
    next(new ValidationError('Priority must be one of: low, medium, high, urgent, critical'));
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
    
  if (imageUrls !== undefined && !Array.isArray(imageUrls)) {
    next(new ValidationError('Image URLs must be an array'));
    return;
  }
  
  if (tags !== undefined && !Array.isArray(tags)) {
    next(new ValidationError('Tags must be an array'));
    return;
  }

  if (priority !== undefined && 
      !['low', 'medium', 'high', 'urgent', 'critical'].includes(priority)) {
    next(new ValidationError('Priority must be one of: low, medium, high, urgent, critical'));
    return;
  }
  
  next();
};

export const validateTagCreate = (req: Request, res: Response, next: NextFunction): void => {
  const { name } = req.body;
  
  if (!name) {
    next(new ValidationError('Tag name is required'));
    return;
  }
  
  if (typeof name !== 'string') {
    next(new ValidationError('Tag name must be a string'));
    return;
  }
  
  if (name.trim().length < 1) {
    next(new ValidationError('Tag name cannot be empty'));
    return;
  }
  
  next();
};

export const validateTagId = (req: Request, res: Response, next: NextFunction): void => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    next(new ValidationError('Tag ID must be a positive number'));
    return;
  }
  
  next();
};

export const validateTagName = (req: Request, res: Response, next: NextFunction): void => {
  const { name } = req.params;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    next(new ValidationError('Tag name is required and cannot be empty'));
    return;
  }
  
  next();
};
