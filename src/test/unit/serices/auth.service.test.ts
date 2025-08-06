// src/test/unit/services/auth.service.test.ts
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { AuthenticationError, ValidationError } from '../../../utils/errors';
import { config } from '../../../config';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

// Create mock repositories and services
const mockUserRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findByVerificationToken: jest.fn(),
  verifyUser: jest.fn(),
  setVerificationToken: jest.fn(),
  findByResetPasswordToken: jest.fn(),
  setResetPasswordToken: jest.fn(),
  updatePassword: jest.fn()
};

const mockEmailService = {
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
};

const mockRefreshTokenRepository = {
  create: jest.fn(),
  findByToken: jest.fn(),
  updateLastUsed: jest.fn(),
  revokeToken: jest.fn(),
  revokeAllUserTokens: jest.fn(),
  getUserActiveSessions: jest.fn(),
  removeExpiredTokens: jest.fn()
};

describe('AuthService', () => {
  let authService: AuthService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(
      mockUserRepository as any,
      mockEmailService as any,
      mockRefreshTokenRepository as any
    );
  });
  
  describe('validateToken', () => {
    it('should return decoded token payload for valid token', async () => {
      const mockPayload = { userId: 1, email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      
      const result = await authService.validateToken('valid-token');
      
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', config.jwtSecret);
      expect(result).toEqual(mockPayload);
    });
    
    it('should throw AuthenticationError for invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await expect(authService.validateToken('invalid-token'))
        .rejects
        .toThrow(AuthenticationError);
    });
  });
  
  describe('login', () => {
    it('should return tokens and user for valid credentials', async () => {
      // Setup mocks
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        isVerified: true
      };
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');
      
      // Execute test
      const result = await authService.login({
        email: 'test@example.com',
        password: 'correct-password'
      });
      
      // Verify results
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', 'hashed-password');
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(Object.keys(result.user)).not.toContain('password');
    });
    
    it('should throw error for unverified user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        isVerified: false
      };
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      await expect(authService.login({
        email: 'test@example.com',
        password: 'password'
      }))
        .rejects
        .toThrow(AuthenticationError);
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled(); // Should not check password
    });
    
    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        isVerified: true
      };
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      await expect(authService.login({
        email: 'test@example.com',
        password: 'wrong-password'
      }))
        .rejects
        .toThrow(AuthenticationError);
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
    });
  });
  
  describe('register', () => {
    it('should create a new user and send verification email', async () => {
      // Setup mocks
      mockUserRepository.findByEmail.mockResolvedValue(null); // No existing user
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepository.create.mockResolvedValue({
        id: 1,
        name: 'New User',
        email: 'new@example.com',
        password: 'hashed-password',
        isVerified: false,
        verificationToken: '123456',
        createdAt: new Date()
      });
      
      // Execute test
      const result = await authService.register({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      });
      
      // Verify results
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('verificationToken');
      expect(Object.keys(result.user)).not.toContain('password');
    });
    
    it('should throw error if email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'existing@example.com'
      });
      
      await expect(authService.register({
        name: 'New User',
        email: 'existing@example.com',
        password: 'password123'
      }))
        .rejects
        .toThrow(ValidationError);
      
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('existing@example.com');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });
  
  describe('verifyEmail', () => {
    it('should verify a user with valid token', async () => {
      mockUserRepository.findByVerificationToken.mockResolvedValue({
        id: 1,
        email: 'user@example.com'
      });
      
      await authService.verifyEmail('valid-token');
      
      expect(mockUserRepository.findByVerificationToken).toHaveBeenCalledWith('valid-token');
      expect(mockUserRepository.verifyUser).toHaveBeenCalledWith(1);
    });
    
    it('should throw error for invalid token', async () => {
      mockUserRepository.findByVerificationToken.mockResolvedValue(null);
      
      await expect(authService.verifyEmail('invalid-token'))
        .rejects
        .toThrow(ValidationError);
      
      expect(mockUserRepository.findByVerificationToken).toHaveBeenCalledWith('invalid-token');
      expect(mockUserRepository.verifyUser).not.toHaveBeenCalled();
    });
  });
});