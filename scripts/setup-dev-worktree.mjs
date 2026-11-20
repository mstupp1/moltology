import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'

function lstatOrNull(target) {
  try {
    return fs.lstatSync(target)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return null
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function sameFileContent(pathA, pathB) {
  if (!fs.existsSync(pathA) || !fs.existsSync(pathB)) return false
  return fs.readFileSync(pathA, 'utf8') === fs.readFileSync(pathB, 'utf8')
}

function formatSyncSummary(status) {
  if (status.reason === 'missing') return 'node_modules/.package-lock.json missing'
  if (status.reason === 'unreadable') return 'lockfile metadata unreadable'
  const items = [
    ...status.missing.map((name) => `missing ${name}`),
    ...status.mismatched.map((name) => `version ${name}`),
  ]
  const shown = items.slice(0, 5).join(', ')
  return items.length > 5 ? `${shown}, +${items.length - 5} more` : shown
}

function runDefaultNpmCi(targetDir) {
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci'], {
    cwd: targetDir,
    stdio: 'inherit',
  })
}

function pointsToTarget(linkPath, targetDir) {
  try {
    const rawTarget = path.resolve(path.dirname(linkPath), fs.readlinkSync(linkPath))
    const resolvedTarget = fs.existsSync(rawTarget) ? fs.realpathSync(rawTarget) : rawTarget
    const resolvedExpected = fs.existsSync(targetDir) ? fs.realpathSync(targetDir) : path.resolve(targetDir)
    return resolvedTarget === resolvedExpected
  } catch {
    return false
  }
}

/** Compare a checkout's installed node_modules against a package-lock.json. */
export function nodeModulesSyncStatus(dir, lockfilePath = path.join(dir, 'package-lock.json')) {
  if (!fs.existsSync(lockfilePath)) return { ok: true, missing: [], mismatched: [] }
  const nodeModulesDir = path.join(dir, 'node_modules')
  const hiddenLockPath = path.join(nodeModulesDir, '.package-lock.json')
  if (!fs.existsSync(nodeModulesDir) || !fs.existsSync(hiddenLockPath)) {
    return { ok: false, reason: 'missing', missing: [], mismatched: [] }
  }
  const lock = readJson(lockfilePath)
  const hiddenLock = readJson(hiddenLockPath)
  if (!lock || !hiddenLock) {
    return { ok: false, reason: 'unreadable', missing: [], mismatched: [] }
  }
  const missing = []
  const mismatched = []
  for (const [pkgPath, meta] of Object.entries(lock.packages ?? {})) {
    if (!pkgPath || meta?.optional || meta?.link) continue
    const installed = hiddenLock.packages?.[pkgPath]
    const name = pkgPath.replace(/^node_modules\//, '')
    if (!installed) {
      missing.push(name)
    } else if (meta?.version && installed.version !== meta.version) {
      mismatched.push(`${name}@${meta.version}`)
    }
  }
  const rootPkg = lock.packages?.[''] ?? {}
  const directDeps = { ...rootPkg.dependencies, ...rootPkg.devDependencies }
  for (const name of Object.keys(directDeps)) {
    if (!fs.existsSync(path.join(nodeModulesDir, name)) && !missing.includes(name)) {
      missing.push(name)
    }
  }
  return { ok: missing.length === 0 && mismatched.length === 0, missing, mismatched }
}

function ensureInstalled(targetDir, lockfilePath, label, installDeps) {
  try {
    installDeps(targetDir)
  } catch (error) {
    throw new Error(`Failed to install dependencies in ${label} (${targetDir}): ${error.message}`)
  }
  const after = nodeModulesSyncStatus(targetDir, lockfilePath)
  if (!after.ok) {
    throw new Error(
      `Dependencies in ${label} (${targetDir}) are still out of sync (${formatSyncSummary(after)}). Run \`npm ci\` in ${targetDir}.`,
    )
  }
}

function ensureWorktreeDependencies(cwd, mainRoot, installDeps) {
  const worktreeLock = path.join(cwd, 'package-lock.json')
  const mainLock = path.join(mainRoot, 'package-lock.json')
  const localModules = path.join(cwd, 'node_modules')
  const sharedModules = path.join(mainRoot, 'node_modules')
  const localStat = lstatOrNull(localModules)

  const syncMainAndLink = () => {
    try {
      ensureInstalled(mainRoot, worktreeLock, 'main checkout', installDeps)
      if (!lstatOrNull(localModules)) fs.symlinkSync(sharedModules, localModules, 'dir')
      return
    } catch (error) {
      console.log(`[dev] Could not refresh main checkout dependencies (${error.message}); installing locally in worktree...`)
    }
    if (lstatOrNull(localModules)?.isSymbolicLink()) fs.unlinkSync(localModules)
    ensureInstalled(cwd, worktreeLock, 'worktree', installDeps)
  }

  if (!localStat) {
    if (!fs.existsSync(worktreeLock)) {
      if (fs.existsSync(sharedModules)) {
        fs.symlinkSync(sharedModules, localModules, 'dir')
        console.log('[dev] Reusing the main checkout’s dependencies.')
      }
      return
    }
    if (nodeModulesSyncStatus(mainRoot, worktreeLock).ok) {
      fs.symlinkSync(sharedModules, localModules, 'dir')
      console.log('[dev] Reusing the main checkout’s dependencies.')
      return
    }
    if (sameFileContent(worktreeLock, mainLock)) {
      console.log('[dev] Main checkout dependencies are out of sync with package-lock.json; running npm ci in the main checkout...')
      syncMainAndLink()
      return
    }
    console.log('[dev] Worktree package-lock.json differs from the main checkout; installing local dependencies with npm ci...')
    ensureInstalled(cwd, worktreeLock, 'worktree', installDeps)
    return
  }

  if (localStat.isSymbolicLink()) {
    const status = nodeModulesSyncStatus(cwd, worktreeLock)
    if (status.ok) return
    if (pointsToTarget(localModules, sharedModules) && sameFileContent(worktreeLock, mainLock)) {
      console.log(`[dev] Shared dependencies are out of sync with package-lock.json (${formatSyncSummary(status)}); refreshing main checkout...`)
      syncMainAndLink()
      return
    }
    fs.unlinkSync(localModules)
    if (nodeModulesSyncStatus(mainRoot, worktreeLock).ok) {
      fs.symlinkSync(sharedModules, localModules, 'dir')
      console.log('[dev] Reusing the main checkout’s dependencies.')
    } else {
      console.log('[dev] Worktree package-lock.json differs from the main checkout; installing local dependencies with npm ci...')
      ensureInstalled(cwd, worktreeLock, 'worktree', installDeps)
    }
    return
  }

  const status = nodeModulesSyncStatus(cwd, worktreeLock)
  if (!status.ok) {
    console.log(`[dev] Local dependencies are out of sync with package-lock.json (${formatSyncSummary(status)}); running npm ci...`)
    ensureInstalled(cwd, worktreeLock, 'worktree', installDeps)
  }
}

// npm runs this before local development commands. Ensure dependencies match package-lock.json
// and reuse the main checkout's setup when valid, while leaving explicit worktree overrides untouched.
export async function setupDevWorktree(
  cwd = process.cwd(),
  { dependenciesOnly = false, installDeps = runDefaultNpmCi } = {},
) {
  const commonDir = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
  const mainRoot = path.dirname(commonDir)
  if (path.basename(commonDir) !== '.git') return

  const resolvedCwd = fs.existsSync(cwd) ? fs.realpathSync(cwd) : path.resolve(cwd)
  const resolvedMain = fs.existsSync(mainRoot) ? fs.realpathSync(mainRoot) : path.resolve(mainRoot)
  if (resolvedCwd === resolvedMain) {
    const status = nodeModulesSyncStatus(cwd)
    if (!status.ok) {
      console.log(`[dev] Dependencies are out of sync with package-lock.json (${formatSyncSummary(status)}); running npm ci...`)
      ensureInstalled(cwd, path.join(cwd, 'package-lock.json'), 'main checkout', installDeps)
    }
    return
  }

  ensureWorktreeDependencies(cwd, mainRoot, installDeps)

  // Tests and build/type checks only need dependencies; leave environment setup to dev.
  if (dependenciesOnly) return
  if (['.env', '.env.local', '.env.development', '.env.development.local'].some((name) => Boolean(lstatOrNull(path.join(cwd, name))))) return
  const sharedEnv = path.join(mainRoot, '.env')
  if (!fs.existsSync(sharedEnv)) {
    console.log('[dev] No local environment found; guest pages work, but login needs development credentials in .env.')
    return
  }
  const env = parseEnv(fs.readFileSync(sharedEnv, 'utf8'))
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
