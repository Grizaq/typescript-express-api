import dotenv from 'dotenv';

// Load .env file
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // Add more configuration as needed
};