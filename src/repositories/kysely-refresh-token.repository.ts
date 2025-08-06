// src/repositories/kysely-refresh-token.repository.ts
import { Kysely } from 'kysely';
import { Database } from '../db/schema';
import { RefreshToken, DeviceInfo } from '../models/refresh-token.model';
import { RefreshTokenRepository } from './refresh-token.repository';

export class KyselyRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private db: Kysely<Database>) {}

  async create(token: string, userId: number, expiresAt: Date, deviceInfo?: DeviceInfo): Promise<RefreshToken> {
    const result = await this.db
      .insertInto('refresh_token')
      .values({
        token,
        user_id: userId,
        expires_at: expiresAt,
        created_at: new Date(),
        revoked: false,
        device_name: deviceInfo?.deviceName || null,
        device_type: deviceInfo?.deviceType || null,
        browser: deviceInfo?.browser || null,
        ip_address: deviceInfo?.ipAddress || null,
        last_used: new Date()
      })
      .returning([
        'id', 'token', 'user_id', 'expires_at', 'created_at', 'revoked', 
        'replaced_by_token', 'device_name', 'device_type', 'browser', 
        'ip_address', 'last_used'
      ])
      .executeTakeFirstOrThrow();
    
    return this.mapDbTokenToModel(result);
  }

  async findById(id: number): Promise<RefreshToken | undefined> {
    const result = await this.db
      .selectFrom('refresh_token')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    
    if (!result) return undefined;
    
    return this.mapDbTokenToModel(result);
  }

  async findByToken(token: string): Promise<RefreshToken | undefined> {
    const result = await this.db
      .selectFrom('refresh_token')
      .selectAll()
      .where('token', '=', token)
      .executeTakeFirst();
    
    if (!result) return undefined;
    
    return this.mapDbTokenToModel(result);
  }

  async updateLastUsed(token: string): Promise<void> {
    await this.db
      .updateTable('refresh_token')
      .set({ last_used: new Date() })
      .where('token', '=', token)
      .execute();
  }

  async updateDeviceInfo(token: string, deviceInfo: DeviceInfo): Promise<void> {
    await this.db
      .updateTable('refresh_token')
      .set({
        device_name: deviceInfo.deviceName || null,
        device_type: deviceInfo.deviceType || null,
        browser: deviceInfo.browser || null,
        ip_address: deviceInfo.ipAddress || null
      })
      .where('token', '=', token)
      .execute();
  }

  async revokeToken(token: string, replacedByToken?: string): Promise<RefreshToken | undefined> {
    const result = await this.db
      .updateTable('refresh_token')
      .set({
        revoked: true,
        replaced_by_token: replacedByToken || null
      })
      .where('token', '=', token)
      .returning([
        'id', 'token', 'user_id', 'expires_at', 'created_at', 'revoked', 
        'replaced_by_token', 'device_name', 'device_type', 'browser', 
        'ip_address', 'last_used'
      ])
      .executeTakeFirst();
    
    if (!result) return undefined;
    
    return this.mapDbTokenToModel(result);
  }

  async revokeById(id: number): Promise<RefreshToken | undefined> {
    const result = await this.db
      .updateTable('refresh_token')
      .set({ revoked: true })
      .where('id', '=', id)
      .returning([
        'id', 'token', 'user_id', 'expires_at', 'created_at', 'revoked', 
        'replaced_by_token', 'device_name', 'device_type', 'browser', 
        'ip_address', 'last_used'
      ])
      .executeTakeFirst();
    
    if (!result) return undefined;
    
    return this.mapDbTokenToModel(result);
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.db
      .updateTable('refresh_token')
      .set({ revoked: true })
      .where('user_id', '=', userId)
      .where('revoked', '=', false)
      .execute();
  }

  async revokeAllExcept(userId: number, currentToken: string): Promise<void> {
    await this.db
      .updateTable('refresh_token')
      .set({ revoked: true })
      .where('user_id', '=', userId)
      .where('token', '!=', currentToken)
      .where('revoked', '=', false)
      .execute();
  }

  async getUserActiveSessions(userId: number): Promise<RefreshToken[]> {
    const results = await this.db
      .selectFrom('refresh_token')
      .selectAll()
      .where('user_id', '=', userId)
      .where('revoked', '=', false)
      .where('expires_at', '>', new Date())
      .orderBy('last_used', 'desc')
      .execute();
    
    return results.map(result => this.mapDbTokenToModel(result));
  }

  async removeExpiredTokens(): Promise<number> {
    const result = await this.db
      .deleteFrom('refresh_token')
      .where('expires_at', '<', new Date())
      .where('revoked', '=', true)
      .executeTakeFirst();
    
    // Convert bigint to number
    return result?.numDeletedRows ? Number(result.numDeletedRows) : 0;
  }

  private mapDbTokenToModel(dbToken: any): RefreshToken {
    return {
      id: dbToken.id,
      token: dbToken.token,
      userId: dbToken.user_id,
      expiresAt: dbToken.expires_at,
      createdAt: dbToken.created_at,
      revoked: dbToken.revoked,
      replacedByToken: dbToken.replaced_by_token || undefined,
      deviceName: dbToken.device_name || undefined,
      deviceType: dbToken.device_type || undefined,
      browser: dbToken.browser || undefined,
      ipAddress: dbToken.ip_address || undefined,
      lastUsed: dbToken.last_used || undefined
    };
  }
}