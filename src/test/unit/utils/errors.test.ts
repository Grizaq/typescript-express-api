// src/test/unit/utils/errors.test.ts
import { 
  AppError, 
  NotFoundError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError 
} from '../../../utils/errors';

describe('Error Utilities', () => {
  describe('AppError', () => {
    it('should create an error with the correct properties', () => {
      const message = 'Test error message';
      const statusCode = 418; // I'm a teapot
      
      const error = new AppError(message, statusCode);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.name).toBe('AppError');
    });
  });
  
  describe('NotFoundError', () => {
    it('should create a 404 error with the correct message', () => {
      const resource = 'User';
      const id = 123;
      
      const error = new NotFoundError(resource, id);
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User with ID 123 not found');
    });
    
    it('should work with string IDs', () => {
      const resource = 'Tag';
      const id = 'work';
      
      const error = new NotFoundError(resource, id);
      
      expect(error.message).toBe('Tag with ID work not found');
    });
  });
  
  describe('ValidationError', () => {
    it('should create a 400 error with the provided message', () => {
      const message = 'Invalid input data';
      
      const error = new ValidationError(message);
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe(message);
    });
  });
  
  describe('AuthenticationError', () => {
    it('should create a 401 error with the provided message', () => {
      const message = 'Invalid credentials';
      
      const error = new AuthenticationError(message);
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe(message);
    });
  });
  
  describe('AuthorizationError', () => {
    it('should create a 403 error with the provided message', () => {
      const message = 'Insufficient permissions';
      
      const error = new AuthorizationError(message);
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe(message);
    });
  });
});