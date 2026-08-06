import { z } from 'zod';
import dotenv from 'dotenv';

// Load env vars based on environment
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  MONGO_URI: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.string().default('10').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
