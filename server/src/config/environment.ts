import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/upvia',
  JWT_SECRET: process.env.JWT_SECRET || 'upvia_super_secret_jwt_access_key_2026_enterprise_production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'upvia_super_secret_jwt_refresh_key_2026_enterprise_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  S3_ENDPOINT: process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY || 'minioadmin',
  S3_SECRET_KEY: process.env.S3_SECRET_KEY || 'minioadmin',
  S3_BUCKET: process.env.S3_BUCKET || 'upvia-documents',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  // Alias of FRONTEND_URL used specifically for building activation-link
  // URLs; kept distinct so it can point at a different host if invitations
  // are ever sent to a domain other than the app's own CORS origin.
  CLIENT_URL: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
};
