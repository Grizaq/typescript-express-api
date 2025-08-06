// src/config/index.ts
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

export const config = {
  appName: process.env.APP_NAME || 'Todo App',
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database config
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'todo_db',
  },
  
  // JWT config
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d', // Access token: 1 day
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d', // Refresh token: 30 days
  
  // Email config
  email: {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@todoapp.com'
  }
};