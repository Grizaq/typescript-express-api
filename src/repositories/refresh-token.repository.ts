// src/repositories/refresh-token.repository.ts
import { RefreshToken, DeviceInfo } from '../models/refresh-token.model';

export interface RefreshTokenRepository {
  create(token: string, userId: number, expiresAt: Date, deviceInfo?: DeviceInfo): Promise<RefreshToken>;
  findByToken(token: string): Promise<RefreshToken | undefined>;
  updateLastUsed(token: string): Promise<void>;
  revokeToken(token: string, replacedByToken?: string): Promise<RefreshToken | undefined>;
  revokeAllUserTokens(userId: number): Promise<void>;
  getUserActiveSessions(userId: number): Promise<RefreshToken[]>;
  removeExpiredTokens(): Promise<number>; // Returns count of removed tokens
}