/// <reference types="vitest" />
import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import { redact } from '@tanstack/redact/vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { realpathSync } from 'node:fs'
import { resolveViteEmailVerificationEnabled, resolveViteGoogleAuthEnabled } from './src/lib/auth-config.ts'

const isTest = Boolean(process.env.VITEST)
const shouldUseRedact = process.env.DISABLE_REDACT !== 'true'

// Bucket media is served at /media/* by a cached Vercel rewrite (vercel.json). Locally we proxy
// to the live site so dev servers and screenshot runs hit the CDN cache, not the Neon bucket.
const mediaProxy = {
  '/media': {
    target: process.env.MEDIA_PROXY_ORIGIN || 'https://moltology.org',
    changeOrigin: true,
  },
}

function syncPublicGoogleAuthFlag(mode: string) {
  if (isTest) return
  const env = loadEnv(mode, process.cwd(), '')
  process.env.VITE_GOOGLE_AUTH_ENABLED = resolveViteGoogleAuthEnabled({
    VITE_GOOGLE_AUTH_ENABLED: env.VITE_GOOGLE_AUTH_ENABLED || process.env.VITE_GOOGLE_AUTH_ENABLED,
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  })
}

function syncPublicEmailVerificationFlag(mode: string) {
  if (isTest) return
  const env = loadEnv(mode, process.cwd(), '')
  process.env.VITE_EMAIL_VERIFICATION_ENABLED = resolveViteEmailVerificationEnabled({
    VITE_EMAIL_VERIFICATION_ENABLED:
      env.VITE_EMAIL_VERIFICATION_ENABLED || process.env.VITE_EMAIL_VERIFICATION_ENABLED,
    EMAIL_VERIFICATION_ENABLED: env.EMAIL_VERIFICATION_ENABLED || process.env.EMAIL_VERIFICATION_ENABLED,
  })
}

export default defineConfig(({ mode, command }) => {
  if (command === 'serve' && !isTest) {
    // Server-only credentials stay in process.env; Vite exposes only VITE_* to clients.
    const localEnv = loadEnv(mode, process.cwd(), '')
    for (const [key, value] of Object.entries(localEnv)) {
      if (process.env[key] === undefined) process.env[key] = value
    }
  }
  syncPublicGoogleAuthFlag(mode)
  syncPublicEmailVerificationFlag(mode)
  return {
    ...(isTest
      ? {}
      : {
          define: {
            'import.meta.env.VITE_GOOGLE_AUTH_ENABLED': JSON.stringify(
              process.env.VITE_GOOGLE_AUTH_ENABLED || 'false',
            ),
            'import.meta.env.VITE_EMAIL_VERIFICATION_ENABLED': JSON.stringify(
              process.env.VITE_EMAIL_VERIFICATION_ENABLED || 'false',
            ),
          },
        }),
    // Keep generated caches in this checkout when node_modules is shared by worktrees.
    cacheDir: 'tmp/vite',
    resolve: {
      mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    build: {
      sourcemap: true,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [{
              name: 'auth-vendor',
              test: (id: string) =>
                id.includes('node_modules/@neondatabase/') ||
                id.includes('node_modules/better-auth') ||
                id.includes('node_modules/@better-auth/') ||
                id.includes('node_modules/@supabase/auth-js'),
            }],
          },
        },
      },
    },
    server: {
      port: 3000,
      host: true,
      // Auth uses the configured port. Fail clearly instead of silently changing origins.
      strictPort: true,
      // Worktrees can share node_modules through a symlink outside the workspace.
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd()), realpathSync(path.resolve(process.cwd(), 'node_modules'))],
      },
      proxy: mediaProxy,
      hmr: {
        overlay: true,
      },
      watch: {
        usePolling: false,
      },
    },
    preview: {
      proxy: mediaProxy,
    },
    test: {
      ...(mode === 'integration' ? { include: ['src/**/*.integration.test.ts'] } : {}),
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      server: {
        deps: {
          inline: true,
        },
      },
      exclude: [
        '**/node_modules/**', '**/dist/**', '**/.claude/**', '**/.git/**',
        ...(mode === 'integration' ? [] : ['**/*.integration.test.ts']),
      ],
    },
    plugins: [
      ...(!isTest && command === 'serve' ? [{
        name: 'local-worktree-auth-origin',
        enforce: 'pre',
        config(config) {
          // Nitro starts its worker before configResolved; set its inherited env now.
          const port = Number.parseInt(process.env.PORT || '') || config.server?.port || 3000
          process.env.BETTER_AUTH_URL = `http://localhost:${port}`
          process.env.BETTER_AUTH_TRUSTED_ORIGINS = [
            process.env.BETTER_AUTH_TRUSTED_ORIGINS,
            `http://localhost:${port}`,
            `http://127.0.0.1:${port}`,
          ].filter(Boolean).join(',')
        },
      } satisfies import('vite').Plugin] : []),
      tailwindcss(),
      ...(isTest
        ? []
        : [
            tanstackStart({
              router: {
                routeFileIgnorePattern: '.*\\.test\\..*',
                autoCodeSplitting: true,
              },
            }),
            nitro({ buildDir: '.nitro', vercel: { functionRules: { '/api/store/recovery': { maxDuration: 240 } } } }),
          ]),
      viteReact(),
      ...(shouldUseRedact ? [redact()] : []),
    ],
  }
})
