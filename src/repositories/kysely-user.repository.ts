// src/repositories/kysely-user.repository.ts
import { Kysely } from 'kysely';
import { Database } from '../db/schema';
import { User } from '../models/user.model';
import { UserRepository } from './user.repository';

export class KyselyUserRepository implements UserRepository {
  constructor(private db: Kysely<Database>) {}

  async findAll(): Promise<User[]> {
    const users = await this.db
      .selectFrom('user')
      .selectAll()
      .execute();
    
    return users.map(user => this.mapDbUserToModel(user));
  }

  async findById(id: number): Promise<User | undefined> {
    const user = await this.db
      .selectFrom('user')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    
    if (!user) return undefined;
    
    return this.mapDbUserToModel(user);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.db
      .selectFrom('user')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
    
    if (!user) return undefined;
    
    return this.mapDbUserToModel(user);
  }

  async create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const result = await this.db
      .insertInto('user')
      .values({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        is_verified: userData.isVerified,
        verification_token: userData.verificationToken || null,
        verification_expires: userData.verificationExpires || null,
        reset_password_token: userData.resetPasswordToken || null,
        reset_password_expires: userData.resetPasswordExpires || null,
        created_at: new Date()
      })
      .returning(['id', 'name', 'email', 'password', 'created_at', 'is_verified', 
                  'verification_token', 'verification_expires', 
                  'reset_password_token', 'reset_password_expires'])
      .executeTakeFirstOrThrow();
    
    return this.mapDbUserToModel(result);
  }

  async update(id: number, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    // Prepare the update data, mapping from model to DB fields
    const updateData: any = {};
    
    if (userData.name !== undefined) updateData.name = userData.name;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.password !== undefined) updateData.password = userData.password;
    if (userData.isVerified !== undefined) updateData.is_verified = userData.isVerified;
    if (userData.verificationToken !== undefined) updateData.verification_token = userData.verificationToken;
    if (userData.verificationExpires !== undefined) updateData.verification_expires = userData.verificationExpires;
    if (userData.resetPasswordToken !== undefined) updateData.reset_password_token = userData.resetPasswordToken;
    if (userData.resetPasswordExpires !== undefined) updateData.reset_password_expires = userData.resetPasswordExpires;

    // If nothing to update
    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    // Update the user
    const result = await this.db
      .updateTable('user')
      .set(updateData)
      .where('id', '=', id)
      .returning(['id', 'name', 'email', 'password', 'created_at', 'is_verified', 
                 'verification_token', 'verification_expires', 
                 'reset_password_token', 'reset_password_expires'])
      .executeTakeFirst();
    
    if (!result) return undefined;
    
    return this.mapDbUserToModel(result);
  }

  async delete(id: number): Promise<User | undefined> {
    // Get the user before deleting
    const userToDelete = await this.findById(id);
    if (!userToDelete) return undefined;
    
    // Delete the user
    await this.db
      .deleteFrom('user')
      .where('id', '=', id)
      .execute();
    
    return userToDelete;
  }

  async setVerificationToken(userId: number, token: string, expires: Date): Promise<void> {
    await this.db
      .updateTable('user')
      .set({
        verification_token: token,
        verification_expires: expires
      })
      .where('id', '=', userId)
      .execute();
  }

  async verifyUser(userId: number): Promise<void> {
    await this.db
      .updateTable('user')
      .set({
        is_verified: true,
        verification_token: null,
        verification_expires: null
      })
      .where('id', '=', userId)
      .execute();
  }

  async findByVerificationToken(token: string): Promise<User | undefined> {
    const user = await this.db
      .selectFrom('user')
      .selectAll()
      .where('verification_token', '=', token)
      .where('verification_expires', '>', new Date())
      .executeTakeFirst();
    
    if (!user) return undefined;
    
    return this.mapDbUserToModel(user);
  }

  async setResetPasswordToken(userId: number, token: string, expires: Date): Promise<void> {
    await this.db
      .updateTable('user')
      .set({
        reset_password_token: token,
        reset_password_expires: expires
      })
      .where('id', '=', userId)
      .execute();
  }

  async findByResetPasswordToken(token: string): Promise<User | undefined> {
    const user = await this.db
      .selectFrom('user')
      .selectAll()
      .where('reset_password_token', '=', token)
      .where('reset_password_expires', '>', new Date())
      .executeTakeFirst();
    
    if (!user) return undefined;
    
    return this.mapDbUserToModel(user);
  }

  async updatePassword(userId: number, password: string): Promise<void> {
    await this.db
      .updateTable('user')
      .set({
        password: password,
        reset_password_token: null,
        reset_password_expires: null
      })
      .where('id', '=', userId)
      .execute();
  }

  // Helper method to map database user to model
  private mapDbUserToModel(dbUser: any): User {
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      password: dbUser.password,
      createdAt: dbUser.created_at,
      isVerified: dbUser.is_verified,
      verificationToken: dbUser.verification_token || undefined,
      verificationExpires: dbUser.verification_expires || undefined,
      resetPasswordToken: dbUser.reset_password_token || undefined,
      resetPasswordExpires: dbUser.reset_password_expires || undefined
    };
  }
}