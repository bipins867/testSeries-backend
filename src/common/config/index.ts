import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'testseries_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    logging: process.env.NODE_ENV !== 'production',
  },

  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  openai: {
    apiKey: requireEnv('OPENAI_API_KEY'),
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    generationTemperature: 0.7,
    validationTemperature: 0.2,
  },

  quiz: {
    minConfidence: 0.7,
    maxRetries: 3,
    maxQuestionsPerRequest: 20,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@testseries.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    firstName: process.env.ADMIN_FIRST_NAME || 'Super',
    lastName: process.env.ADMIN_LAST_NAME || 'Admin',
  },
} as const;
