import { z } from 'zod'

function getRawEnv(): Record<string, unknown> {
  const processEnv = typeof process !== 'undefined' && process.env ? process.env : {}
  const importMetaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {}

  return {
    DATABASE_URL: processEnv.DATABASE_URL || importMetaEnv.DATABASE_URL || importMetaEnv.VITE_DATABASE_URL,
    BETTER_AUTH_URL: processEnv.BETTER_AUTH_URL || importMetaEnv.BETTER_AUTH_URL || importMetaEnv.VITE_BETTER_AUTH_URL,
    VITE_GOOGLE_AUTH_ENABLED: importMetaEnv.VITE_GOOGLE_AUTH_ENABLED || processEnv.VITE_GOOGLE_AUTH_ENABLED,
    VITE_GOOGLE_CLIENT_ID: importMetaEnv.VITE_GOOGLE_CLIENT_ID || processEnv.VITE_GOOGLE_CLIENT_ID,
    VERCEL_OIDC_TOKEN: processEnv.VERCEL_OIDC_TOKEN || importMetaEnv.VERCEL_OIDC_TOKEN,
    AI_GATEWAY_API_KEY: processEnv.AI_GATEWAY_API_KEY || importMetaEnv.AI_GATEWAY_API_KEY,
    VITE_TURNSTILE_SITE_KEY: importMetaEnv.VITE_TURNSTILE_SITE_KEY || processEnv.VITE_TURNSTILE_SITE_KEY,
    TURNSTILE_SECRET_KEY: processEnv.TURNSTILE_SECRET_KEY || importMetaEnv.TURNSTILE_SECRET_KEY,
    RESEND_API_KEY: processEnv.RESEND_API_KEY || importMetaEnv.RESEND_API_KEY,
    RESEND_FROM_EMAIL: processEnv.RESEND_FROM_EMAIL || importMetaEnv.RESEND_FROM_EMAIL,
    NODE_ENV: processEnv.NODE_ENV || importMetaEnv.MODE,
  }
}

export const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://neondb_owner:dummy@ep-dummy.us-east-1.aws.neon.tech/neondb?sslmode=require'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  VITE_GOOGLE_AUTH_ENABLED: z.string().optional(),
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  VERCEL_OIDC_TOKEN: z.string().optional(),
  AI_GATEWAY_API_KEY: z.string().optional(),
  VITE_TURNSTILE_SITE_KEY: z.string().default('1x00000000000000000000AA'),
  TURNSTILE_SECRET_KEY: z.string().default('1x0000000000000000000000000000000AA'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(customEnv?: Record<string, unknown>): Env {
  const raw = customEnv ?? getRawEnv()
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined && value !== '') {
      cleaned[key] = value
    }
  }

  const result = envSchema.safeParse(cleaned)
  if (!result.success) {
    console.error('❌ Environment Variable Validation Failed:')
    console.error(result.error.format())
    throw new Error(`Invalid environment variables: ${result.error.message}`)
  }
  return result.data
}

export const env: Env = validateEnv()
