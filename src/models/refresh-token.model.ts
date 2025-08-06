// src/models/refresh-token.model.ts
export interface RefreshToken {
  id: number;
  token: string;
  userId: number;
  expiresAt: Date;
  createdAt: Date;
  revoked: boolean;
  replacedByToken?: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  ipAddress?: string;
  lastUsed?: Date;
}

export interface DeviceInfo {
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  ipAddress?: string;
}