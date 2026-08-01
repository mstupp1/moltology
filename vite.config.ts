import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './src/lib/auth'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.BETTER_AUTH_SECRET = env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET
  process.env.BETTER_AUTH_URL = env.BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'
  process.env.DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL

  return {
    plugins: [
      react(),
      {
        name: 'better-auth-dev-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.startsWith('/api/auth')) {
              return toNodeHandler(auth)(req, res)
            }
            next()
          })
        }
      }
    ],
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
    }
  }
})
