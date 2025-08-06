// src/models/user.model.ts
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  isVerified: boolean;
  verificationToken?: string;
  verificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration extends UserCredentials {
  name: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
}