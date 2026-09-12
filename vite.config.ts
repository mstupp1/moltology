/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import path from 'path'
import { resolveViteGoogleAuthEnabled } from './src/lib/auth-config'

const isTest = Boolean(process.env.VITEST)

function syncPublicGoogleAuthFlag(mode: string) {
  if (isTest) return
  const env = loadEnv(mode, process.cwd(), '')
  process.env.VITE_GOOGLE_AUTH_ENABLED = resolveViteGoogleAuthEnabled({
    VITE_GOOGLE_AUTH_ENABLED: env.VITE_GOOGLE_AUTH_ENABLED || process.env.VITE_GOOGLE_AUTH_ENABLED,
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  })
}

export default defineConfig(({ mode }) => {
  syncPublicGoogleAuthFlag(mode)
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('node_modules/@neondatabase/') ||
              id.includes('node_modules/better-auth') ||
              id.includes('node_modules/@better-auth/') ||
              id.includes('node_modules/@supabase/auth-js')
            ) {
              return 'auth-vendor'
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      host: true,
      hmr: {
        overlay: true,
      },
      watch: {
        usePolling: false,
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
    plugins: [
      ...(isTest
        ? []
        : [
            tanstackStart({
              router: {
                routeFileIgnorePattern: '.*\\.test\\..*',
                autoCodeSplitting: true,
              },
            }),
            nitro(),
          ]),
      viteReact(),
    ],
  }
})
