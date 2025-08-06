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

export const validateUserRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { name, email, password } = req.body;
  
  if (!name) {
    next(new ValidationError('Name is required'));
    return;
  }
  
  if (typeof name !== 'string') {
    next(new ValidationError('Name must be a string'));
    return;
  }
  
  if (name.trim().length < 2) {
    next(new ValidationError('Name must be at least 2 characters long'));
    return;
  }
  
  if (!email) {
    next(new ValidationError('Email is required'));
    return;
  }
  
  if (typeof email !== 'string') {
    next(new ValidationError('Email must be a string'));
    return;
  }
  
  // Simple email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    next(new ValidationError('Invalid email format'));
    return;
  }
  
  if (!password) {
    next(new ValidationError('Password is required'));
    return;
  }
  
  if (typeof password !== 'string') {
    next(new ValidationError('Password must be a string'));
    return;
  }
  
  if (password.length < 8) {
    next(new ValidationError('Password must be at least 8 characters long'));
    return;
  }
  
  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;
  
  if (!email) {
    next(new ValidationError('Email is required'));
    return;
  }
  
  if (typeof email !== 'string') {
    next(new ValidationError('Email must be a string'));
    return;
  }
  
  if (!password) {
    next(new ValidationError('Password is required'));
    return;
  }
  
  if (typeof password !== 'string') {
    next(new ValidationError('Password must be a string'));
    return;
  }
  
  next();
};

export const validateVerification = (req: Request, res: Response, next: NextFunction): void => {
  const { token } = req.body;
  
  if (!token) {
    next(new ValidationError('Verification token is required'));
    return;
  }
  
  if (typeof token !== 'string') {
    next(new ValidationError('Verification token must be a string'));
    return;
  }
  
  // For OTP, ensure it's a 6-digit number
  if (!/^\d{6}$/.test(token)) {
    next(new ValidationError('Verification token must be a 6-digit number'));
    return;
  }
  
  next();
};

export const validatePasswordReset = (req: Request, res: Response, next: NextFunction): void => {
  const { token, newPassword } = req.body;
  
  if (!token) {
    next(new ValidationError('Reset token is required'));
    return;
  }
  
  if (typeof token !== 'string') {
    next(new ValidationError('Reset token must be a string'));
    return;
  }
  
  // For OTP, ensure it's a 6-digit number
  if (!/^\d{6}$/.test(token)) {
    next(new ValidationError('Reset token must be a 6-digit number'));
    return;
  }
  
  if (!newPassword) {
    next(new ValidationError('New password is required'));
    return;
  }
  
  if (typeof newPassword !== 'string') {
    next(new ValidationError('New password must be a string'));
    return;
  }
  
  if (newPassword.length < 8) {
    next(new ValidationError('New password must be at least 8 characters long'));
    return;
  }
  
  next();
};

export const validateRefreshToken = (req: Request, res: Response, next: NextFunction): void => {
  // Check for token in request body or cookie
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  
  if (!token) {
    next(new ValidationError('Refresh token is required'));
    return;
  }
  
  if (typeof token !== 'string') {
    next(new ValidationError('Refresh token must be a string'));
    return;
  }
  
  next();
};
