/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import { rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'path'

const isTest = Boolean(process.env.VITEST)

const SERVER_ONLY_PUBLIC_DIRS = ['audio', 'videos', 'images', 'downloads']

async function pruneFunctionStaticDupes(nitro: any) {
  const isVercel =
    nitro.options.preset === 'vercel' || Boolean(process.env.VERCEL)
  if (!isVercel) return

  const { publicDir, serverDir } = nitro.options.output
  if (!publicDir || !serverDir || publicDir === serverDir) return

  await Promise.all(
    SERVER_ONLY_PUBLIC_DIRS.map(async (dir) => {
      const dupe = path.join(serverDir, dir)
      if (existsSync(path.join(publicDir, dir)) && existsSync(dupe)) {
        await rm(dupe, { recursive: true, force: true })
        nitro.logger.info(`Pruned duplicated static assets from function bundle: ${dir}/`)
      }
    })
  )
}

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: true,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: false
    }
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
            },
          }),
          nitro({
            config: {
              hooks: {
                compiled: pruneFunctionStaticDupes,
              },
            },
          }),
        ]),
    viteReact(),
  ],
})
