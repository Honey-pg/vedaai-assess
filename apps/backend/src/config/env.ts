import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

/** Express Clerk expects CLERK_PUBLISHABLE_KEY; Next often only sets NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY */
if (
  !(process.env.CLERK_PUBLISHABLE_KEY ?? '').trim() &&
  (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '').trim()
) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!.trim();
}

const envSchema = z.object({
  PORT: z.string().default('4000'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/vedaai'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  /** Required for @clerk/express middleware + token parity */
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required for auth'),
  CLERK_PUBLISHABLE_KEY: z.string().min(1, 'CLERK_PUBLISHABLE_KEY is required for Clerk'),
  AI_PROVIDER: z
    .enum(['gemini', 'groq', 'ollama', 'openai', 'anthropic'])
    .default('gemini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash-lite'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3.2'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
