// src/test/setup/test-db.ts
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { TestDatabase } from './test-schema';
import { promises as fs } from 'fs';
import path from 'path';

// Generate a unique database name for this test run
const testDbName = `todo_test_${Date.now()}`;

// Create a test database with PostgreSQL
export async function createTestDb(): Promise<Kysely<TestDatabase>> {
  // Connect to the default PostgreSQL database to create our test database
  const adminPool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });
  
  try {
    // Create the test database
    console.log(`Creating test database: ${testDbName}`);
    await adminPool.query(`CREATE DATABASE ${testDbName}`);
  } catch (error) {
    console.error('Failed to create test database:', error);
    throw error;
  } finally {
    // Close the admin connection
    await adminPool.end();
  }
  
  // Connect to the new test database
  const db = new Kysely<TestDatabase>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: testDbName
      })
    })
  });
  
  // Apply migrations to set up the schema
  await applyMigrations(db);
  
  // Return the connected database
  return db;
}

// Apply all migrations to create the test database schema
async function applyMigrations(db: Kysely<TestDatabase>): Promise<void> {
  // Get all migration files from the migrations folder
  const migrationsDir = path.join(__dirname, '../../db/migrations');
  
  try {
    // Get all migration files
    const files = await fs.readdir(migrationsDir);
    
    // Sort files by name to ensure correct order
    const migrationFiles = files
      .filter(file => file.endsWith('.ts') && !file.includes('squash'))
      .sort();
    
    // Apply each migration
    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}`);
      
      // Import the migration file
      const migration = require(path.join(migrationsDir, file));
      
      // Run the up function
      await migration.up(db);
    }
    
    console.log('All migrations applied successfully');
  } catch (error) {
    console.error('Error applying migrations:', error);
    throw error;
  }
}

// Function to tear down the test database
export async function tearDownTestDb(db: Kysely<TestDatabase>): Promise<void> {
  // Close the connection to the test database
  await db.destroy();
  
  // Connect to the default database to drop the test database
  const adminPool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });
  
  try {
    // Force close all connections and drop the database
    await adminPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${testDbName}'
      AND pid <> pg_backend_pid();
    `);
    
    await adminPool.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    console.log(`Test database dropped: ${testDbName}`);
  } catch (error) {
    console.error('Failed to drop test database:', error);
    throw error;
  } finally {
    // Close the admin connection
    await adminPool.end();
  }
}