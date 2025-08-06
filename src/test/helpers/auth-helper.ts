// src/test/helpers/auth-helper.ts
import * as jwt from 'jsonwebtoken';
import { config } from '../../config';
import { UserRepository } from '../../repositories/user.repository';
import { AuthService } from '../../services/auth.service';

export class AuthTestHelper {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthService
  ) {}

  // Generate a JWT token for a user
  async generateTokenForUser(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    return jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  }

  // Login a user and get tokens
  async loginUser(email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: number;
  }> {
    const result = await this.authService.login({ email, password });
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      userId: user.id
    };
  }
}