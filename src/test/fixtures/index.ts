// src/test/fixtures/index.ts
import { Kysely, sql } from 'kysely';
import * as bcrypt from 'bcrypt';
import { TestDatabase } from '../setup/test-schema';

// Test user data
export const testUsers = [
  {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    isVerified: true
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'adminpass',
    isVerified: true
  },
  {
    name: 'Unverified User',
    email: 'unverified@example.com',
    password: 'unverified',
    isVerified: false,
    verificationToken: '123456',
    verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
];

// Test todo data
export const testTodos = [
  {
    title: 'Test Todo 1',
    description: 'This is a test todo',
    completed: false,
    priority: 'medium',
    imageUrls: [] as string[],
    userEmail: 'test@example.com' // This will be replaced with the actual user ID
  },
  {
    title: 'Test Todo 2',
    description: 'Another test todo',
    completed: true,
    completedAt: new Date(),
    priority: 'high',
    imageUrls: [] as string[],
    userEmail: 'test@example.com' // This will be replaced with the actual user ID
  },
  {
    title: 'Admin Todo',
    description: 'Todo for admin',
    completed: false,
    priority: 'urgent',
    imageUrls: [] as string[],
    userEmail: 'admin@example.com' // This will be replaced with the actual user ID
  }
];

// Test tag data
export const testTags = [
  {
    name: 'work',
    userEmail: 'test@example.com' // This will be replaced with the actual user ID
  },
  {
    name: 'personal',
    userEmail: 'test@example.com' // This will be replaced with the actual user ID
  },
  {
    name: 'admin-tag',
    userEmail: 'admin@example.com' // This will be replaced with the actual user ID
  }
];

// Function to populate the test database with fixture data
export async function loadFixtures(db: Kysely<TestDatabase>): Promise<void> {
  // Insert users
  const insertedUsers = await Promise.all(testUsers.map(async user => {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const timestamp = new Date();
    return db.insertInto('user')
      .values({
        name: user.name,
        email: user.email,
        password: hashedPassword,
        is_verified: user.isVerified,
        verification_token: user.verificationToken || null,
        verification_expires: user.verificationExpires || null,
        reset_password_token: null,
        reset_password_expires: null,
        created_at: timestamp
      })
      .returning(['id', 'email'])
      .executeTakeFirstOrThrow();
  }));

  // Create a map of email to user ID
  const userIdMap = new Map<string, number>();
  insertedUsers.forEach(user => {
    userIdMap.set(user.email, user.id);
  });

  // Insert todos
  const insertedTodos = await Promise.all(testTodos.map(async todo => {
    const userId = userIdMap.get(todo.userEmail);
    if (!userId) throw new Error(`User with email ${todo.userEmail} not found`);
    
    const timestamp = new Date();
    return db.insertInto('todo')
      .values({
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        completed_at: todo.completedAt || null,
        priority: todo.priority as any,
        image_urls: todo.imageUrls,
        user_id: userId,
        created_at: timestamp,
        due_date: null
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();
  }));

  // Insert tags
  const insertedTags = await Promise.all(testTags.map(async tag => {
    const userId = userIdMap.get(tag.userEmail);
    if (!userId) throw new Error(`User with email ${tag.userEmail} not found`);
    
    const timestamp = new Date();
    return db.insertInto('tag')
      .values({
        name: tag.name,
        user_id: userId,
        created_at: timestamp
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();
  }));

  // Create some todo-tag associations
  await db.insertInto('todo_tag')
    .values([
      { todo_id: insertedTodos[0].id, tag_id: insertedTags[0].id },
      { todo_id: insertedTodos[0].id, tag_id: insertedTags[1].id },
      { todo_id: insertedTodos[1].id, tag_id: insertedTags[1].id }
    ])
    .execute();
}

// Function to clear all data from the database
export async function clearFixtures(db: Kysely<TestDatabase>): Promise<void> {
  // Delete in the correct order to respect foreign key constraints
  await db.deleteFrom('todo_tag').execute();
  await db.deleteFrom('todo').execute();
  await db.deleteFrom('tag').execute();
  await db.deleteFrom('refresh_token').execute();
  await db.deleteFrom('user').execute();
}