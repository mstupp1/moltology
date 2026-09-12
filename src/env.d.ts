/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BETTER_AUTH_URL?: string
  readonly VITE_GOOGLE_AUTH_ENABLED?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly DATABASE_URL?: string
      readonly BETTER_AUTH_SECRET?: string
      readonly BETTER_AUTH_URL?: string
      readonly BETTER_AUTH_TRUSTED_ORIGINS?: string
      readonly GOOGLE_CLIENT_ID?: string
      readonly GOOGLE_CLIENT_SECRET?: string
      readonly RESEND_API_KEY?: string
      readonly RESEND_FROM_EMAIL?: string
      readonly NODE_ENV?: 'development' | 'production' | 'test'
    }
  }
}

export {}
