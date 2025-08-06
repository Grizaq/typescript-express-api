// src/test/setup/global-setup.ts
import { Pool } from 'pg';

export default async (): Promise<void> => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Override config values for testing
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_ACCESS_EXPIRES_IN = '1h';
  process.env.JWT_REFRESH_EXPIRES_IN = '1d';
  
  // Override database config for tests
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_USER = 'postgres';
  process.env.DB_PASSWORD = 'postgres';
  process.env.DB_DATABASE = 'postgres'; // This will be overridden by a unique test DB
  
  // Verify that PostgreSQL is running and accessible
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  
  try {
    await pool.query('SELECT 1');
    console.log('Successfully connected to PostgreSQL');
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    console.error('Make sure PostgreSQL is running and accessible with the provided credentials.');
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  // Make sure tests complete properly
const originalExit = process.exit;
process.exit = function(code?: number) {
  console.log(`Test exiting with code: ${code}`);
  return originalExit(code);
};
};