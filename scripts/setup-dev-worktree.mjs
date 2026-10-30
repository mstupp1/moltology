import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// npm runs this before local development commands. Reuse the main checkout's setup, while
// leaving explicit worktree installations and environment files untouched.
export async function setupDevWorktree(cwd = process.cwd(), { dependenciesOnly = false } = {}) {
  const commonDir = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
  const mainRoot = path.dirname(commonDir)
  if (path.resolve(cwd) === mainRoot || path.basename(commonDir) !== '.git') return

  const exists = (target) => {
    try { fs.lstatSync(target); return true } catch (error) {
      if (error.code !== 'ENOENT') throw error
      return false
    }
  }
  const localModules = path.join(cwd, 'node_modules')
  const sharedModules = path.join(mainRoot, 'node_modules')
  if (!exists(localModules) && fs.existsSync(sharedModules)) {
    fs.symlinkSync(sharedModules, localModules, 'dir')
    console.log('[dev] Reusing the main checkout’s dependencies.')
  }
  // Tests and build/type checks only need dependencies; leave environment setup to dev.
  if (dependenciesOnly) return
  if (['.env', '.env.local', '.env.development', '.env.development.local'].some((name) => exists(path.join(cwd, name)))) return
  const sharedEnv = path.join(mainRoot, '.env')
  if (!fs.existsSync(sharedEnv)) {
    console.log('[dev] No local environment found; guest pages work, but login needs development credentials in .env.')
    return
  }
  const { parse } = await import('dotenv')
  const env = parse(fs.readFileSync(sharedEnv))
  const target = (value) => {
    try {
      const url = new URL(value)
      return ['postgres:', 'postgresql:'].includes(url.protocol)
        ? `${url.hostname.toLowerCase().replace('-pooler.', '.')}${url.pathname}` : null
    } catch { return null }
  }
  const database = target(env.DATABASE_URL)
  if (!database || database !== target(env.DEV_DATABASE_URL) || database === target(env.PROD_DATABASE_URL)) {
    throw new Error('Main checkout .env must point DATABASE_URL at DEV_DATABASE_URL, distinct from production. Configure a worktree .env instead.')
  }
  fs.symlinkSync(sharedEnv, path.join(cwd, '.env'))
  console.log('[dev] Reusing the main checkout’s development .env (not copied or committed).')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await setupDevWorktree(process.cwd(), { dependenciesOnly: process.argv.includes('--dependencies-only') })
}
