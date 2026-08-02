/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NEON_AUTH_URL: string
  readonly VITE_NEON_JWKS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly DATABASE_URL?: string
      readonly NODE_ENV?: 'development' | 'production' | 'test'
    }
  }
}

export {}
