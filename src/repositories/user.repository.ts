// src/repositories/user.repository.ts
import { User } from '../models/user.model';

export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  create(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  update(id: number, user: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined>;
  delete(id: number): Promise<User | undefined>;
  
  // Verification methods
  setVerificationToken(userId: number, token: string, expires: Date): Promise<void>;
  verifyUser(userId: number): Promise<void>;
  findByVerificationToken(token: string): Promise<User | undefined>;
  
  // Password reset methods
  setResetPasswordToken(userId: number, token: string, expires: Date): Promise<void>;
  findByResetPasswordToken(token: string): Promise<User | undefined>;
  updatePassword(userId: number, password: string): Promise<void>;
}