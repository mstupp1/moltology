import { z } from 'zod'

export const authSearchSchema = z.object({
  mode: z.enum(['login', 'signup']).optional().catch('login'),
  redirect: z.string().optional(),
  error: z.string().optional(),
})

export type AuthSearch = z.infer<typeof authSearchSchema>

export const settingsSearchSchema = z.object({
  error: z.string().optional(),
})

export type SettingsSearch = z.infer<typeof settingsSearchSchema>

export const oauthErrorSearchSchema = z.object({
  error: z.string().optional(),
  error_description: z.string().optional(),
})
