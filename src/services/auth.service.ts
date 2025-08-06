// src/services/auth.service.ts
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { User, UserCredentials, UserRegistration, TokenPayload } from '../models/user.model';
import { DeviceInfo } from '../models/refresh-token.model';
import { NotFoundError, ValidationError, AuthenticationError, AuthorizationError } from '../utils/errors';
import { config } from '../config';
import { EmailService } from './email.service';

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private refreshTokenRepository: RefreshTokenRepository
  ) {}

  async register(userData: UserRegistration): Promise<{ user: Omit<User, 'password'>, verificationToken: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Generate verification token (6-digit OTP)
    const verificationToken = this.generateOTP();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const newUser = await this.userRepository.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      isVerified: false,
      verificationToken: verificationToken,
      verificationExpires: verificationExpires
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(
      newUser.email,
      newUser.name,
      verificationToken
    );

    // Remove password from returned user
    const { password, ...userWithoutPassword } = newUser;

    return { 
      user: userWithoutPassword,
      verificationToken
    };
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findByVerificationToken(token);
    
    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    await this.userRepository.verifyUser(user.id);
  }

  async login(credentials: UserCredentials): Promise<{ accessToken: string, refreshToken: string, user: Omit<User, 'password'> }> {
    // Find user by email
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new AuthenticationError('Email not verified. Please verify your email before logging in.');
    }

    // Check password
    const passwordValid = await bcrypt.compare(credentials.password, user.password);
    if (!passwordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    
    // Save refresh token with longer expiration (30 days)
    const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepository.create(refreshToken, user.id, refreshTokenExpires);

    // Remove password from returned user
    const { password, ...userWithoutPassword } = user;

    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  // Login with device info tracking
  async loginWithDevice(credentials: UserCredentials, req: any): Promise<{ accessToken: string, refreshToken: string, user: Omit<User, 'password'> }> {
    // Use the regular login method
    const result = await this.login(credentials);
    
    // Extract device info and create a new token with device info
    const deviceInfo = this.extractDeviceInfo(req);
    
    // Get the existing token
    const existingToken = await this.refreshTokenRepository.findByToken(result.refreshToken);
    if (!existingToken) {
      throw new AuthenticationError('Token creation failed');
    }
    
    // Create a new token with device info
    const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const newToken = await this.refreshTokenRepository.create(
      result.refreshToken,
      existingToken.userId,
      refreshTokenExpires,
      deviceInfo
    );
    
    // Update last used time
    await this.refreshTokenRepository.updateLastUsed(result.refreshToken);
    
    return result;
  }

  async refreshToken(token: string): Promise<{ accessToken: string, refreshToken: string }> {
    // Find saved token
    const savedToken = await this.refreshTokenRepository.findByToken(token);
    if (!savedToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Check if token is revoked
    if (savedToken.revoked) {
      throw new AuthenticationError('Refresh token has been revoked');
    }

    // Check if token is expired
    if (savedToken.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token has expired');
    }

    // Get user
    const user = await this.userRepository.findById(savedToken.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Update the last used timestamp
    await this.refreshTokenRepository.updateLastUsed(token);

    // Generate new access token
    const newAccessToken = this.generateAccessToken(user);
    let newRefreshToken = token;

    // Auto-renewal: If refresh token is nearing expiration (less than 7 days left),
    // generate a new one to extend the session
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    if (savedToken.expiresAt < sevenDaysFromNow) {
      // Generate new refresh token with a new 30-day expiration
      newRefreshToken = this.generateRefreshToken();
      const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // Extract device info from saved token
      const deviceInfo: DeviceInfo = {
        deviceName: savedToken.deviceName,
        deviceType: savedToken.deviceType,
        browser: savedToken.browser,
        ipAddress: savedToken.ipAddress
      };
      
      // Save new refresh token with the same device info
      await this.refreshTokenRepository.create(newRefreshToken, user.id, refreshTokenExpires, deviceInfo);
      
      // Revoke old token, marking it as replaced
      await this.refreshTokenRepository.revokeToken(token, newRefreshToken);
    }

    return { 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken 
    };
  }

  async revokeToken(token: string): Promise<void> {
    // Revoke the token
    const result = await this.refreshTokenRepository.revokeToken(token);
    if (!result) {
      throw new ValidationError('Invalid token');
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User', email);
    }

    // Check if already verified
    if (user.isVerified) {
      throw new ValidationError('Email already verified');
    }

    // Generate new verification token
    const verificationToken = this.generateOTP();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await this.userRepository.setVerificationToken(
      user.id, 
      verificationToken, 
      verificationExpires
    );

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );
  }

  async requestPasswordReset(email: string): Promise<void> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return;
    }

    // Generate reset token
    const resetToken = this.generateOTP();
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await this.userRepository.setResetPasswordToken(
      user.id, 
      resetToken, 
      resetExpires
    );

    // Send reset email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user by reset token
    const user = await this.userRepository.findByResetPasswordToken(token);
    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.userRepository.updatePassword(user.id, hashedPassword);
    
    // Revoke all refresh tokens for this user for security
    await this.refreshTokenRepository.revokeAllUserTokens(user.id);
  }

  async validateToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  async getUserById(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }

    // Remove password from returned user
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Get user's active sessions
  async getUserActiveSessions(userId: number): Promise<Array<{
    id: number,
    deviceName: string,
    deviceType: string,
    browser: string,
    ipAddress: string,
    createdAt: Date,
    lastUsed: Date
  }>> {
    const sessions = await this.refreshTokenRepository.getUserActiveSessions(userId);
    
    // Map to a more user-friendly format
    return sessions.map(session => ({
      id: session.id,
      deviceName: session.deviceName || 'Unknown device',
      deviceType: session.deviceType || 'unknown',
      browser: session.browser || 'unknown',
      ipAddress: session.ipAddress || 'unknown',
      createdAt: session.createdAt,
      lastUsed: session.lastUsed || session.createdAt
    }));
  }

  // Revoke a specific session
  async revokeSession(tokenId: number, userId: number): Promise<void> {
    // This is a little tricky since we don't have findById in the repository
    // We'll have to get all sessions and find the matching one
    const sessions = await this.refreshTokenRepository.getUserActiveSessions(userId);
    const session = sessions.find(s => s.id === tokenId);
    
    if (!session) {
      throw new NotFoundError('Session', tokenId);
    }
    
    // Revoke the token
    await this.refreshTokenRepository.revokeToken(session.token);
  }

  // Revoke all sessions except current one
  async revokeAllOtherSessions(userId: number, currentToken: string): Promise<void> {
    // Get all active sessions
    const sessions = await this.refreshTokenRepository.getUserActiveSessions(userId);
    
    // Revoke all except the current one
    for (const session of sessions) {
      if (session.token !== currentToken) {
        await this.refreshTokenRepository.revokeToken(session.token);
      }
    }
  }

  // Extract device info from request
  extractDeviceInfo(req: any): DeviceInfo {
    const userAgent = req.headers['user-agent'] || '';
    
    // Simple device detection - in production, use a proper user-agent parser library
    let deviceType = 'unknown';
    let browser = 'unknown';
    
    if (/mobile/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet/i.test(userAgent)) {
      deviceType = 'tablet';
    } else if (/windows|macintosh|linux/i.test(userAgent)) {
      deviceType = 'desktop';
    }
    
    if (/chrome/i.test(userAgent)) {
      browser = 'Chrome';
    } else if (/firefox/i.test(userAgent)) {
      browser = 'Firefox';
    } else if (/safari/i.test(userAgent)) {
      browser = 'Safari';
    } else if (/edge/i.test(userAgent)) {
      browser = 'Edge';
    } else if (/opera/i.test(userAgent) || /opr/i.test(userAgent)) {
      browser = 'Opera';
    }
    
    return {
      deviceName: `${deviceType} - ${browser}`,
      deviceType,
      browser,
      ipAddress: req.ip || req.connection?.remoteAddress
    };
  }
  
  // Helper methods
  private generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtAccessExpiresIn || '1d' // 1-day access token by default
    });
  }

  private generateRefreshToken(): string {
    // Generate a secure random string
    return crypto.randomBytes(40).toString('hex');
  }

  private generateOTP(): string {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}