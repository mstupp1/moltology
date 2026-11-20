import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { nodeModulesSyncStatus, setupDevWorktree } from './setup-dev-worktree.mjs'

vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }))
let root: string
let main: string
let worktree: string
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'molt-worktree-'))
  main = path.join(root, 'main')
  worktree = path.join(root, 'worktree')
  fs.mkdirSync(main)
  fs.mkdirSync(worktree)
  fs.mkdirSync(path.join(main, 'node_modules'))
  vi.mocked(execFileSync).mockReturnValue(path.join(main, '.git'))
})
afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

const devEnv = 'DATABASE_URL=postgresql://user:secret@ep-dev-pooler.neon.tech/db\nDEV_DATABASE_URL=postgresql://user:secret@ep-dev.neon.tech/db\nPROD_DATABASE_URL=postgresql://user:secret@ep-prod.neon.tech/db\n'

function writeLockfile(dir: string, packages: Record<string, { version: string; optional?: boolean }>) {
  const deps = Object.fromEntries(
    Object.entries(packages)
      .filter(([, meta]) => !meta.optional)
      .map(([name, meta]) => [name, `^${meta.version}`]),
  )
  const lockPackages = Object.fromEntries([
    ['', { name: 'moltology', dependencies: deps }],
    ...Object.entries(packages).map(([name, meta]) => [`node_modules/${name}`, meta]),
  ])
  fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages: lockPackages }))
}

function writeInstalled(dir: string, packages: Record<string, { version: string; optional?: boolean }>) {
  const modulesDir = path.join(dir, 'node_modules')
  fs.mkdirSync(modulesDir, { recursive: true })
  const lockPackages = Object.fromEntries(
    Object.entries(packages).map(([name, meta]) => [`node_modules/${name}`, meta]),
  )
  fs.writeFileSync(path.join(modulesDir, '.package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages: lockPackages }))
  for (const name of Object.keys(packages)) {
    fs.mkdirSync(path.join(modulesDir, name), { recursive: true })
  }
}

describe('worktree dev setup', () => {
  it('reuses dependencies and a confirmed development env, and is idempotent', async () => {
    fs.writeFileSync(path.join(main, '.env'), devEnv)
    await setupDevWorktree(worktree)
    await setupDevWorktree(worktree)
    expect(fs.realpathSync(path.join(worktree, 'node_modules'))).toBe(fs.realpathSync(path.join(main, 'node_modules')))
    expect(fs.realpathSync(path.join(worktree, '.env'))).toBe(fs.realpathSync(path.join(main, '.env')))
  })
  it('prepares dependencies before tests without inheriting environment files', async () => {
    fs.writeFileSync(path.join(main, '.env'), 'DATABASE_URL=unsafe')
    await setupDevWorktree(worktree, { dependenciesOnly: true })
    await setupDevWorktree(worktree, { dependenciesOnly: true })
    expect(fs.realpathSync(path.join(worktree, 'node_modules'))).toBe(fs.realpathSync(path.join(main, 'node_modules')))
    expect(fs.existsSync(path.join(worktree, '.env'))).toBe(false)
  })
  it('preserves explicitly configured dependencies and worktree env overrides', async () => {
    fs.mkdirSync(path.join(worktree, 'node_modules'))
    fs.writeFileSync(path.join(worktree, '.env.local'), 'CUSTOM=value')
    fs.writeFileSync(path.join(main, '.env'), 'DATABASE_URL=unsafe')
    await setupDevWorktree(worktree)
    expect(fs.lstatSync(path.join(worktree, 'node_modules')).isSymbolicLink()).toBe(false)
    expect(fs.readFileSync(path.join(worktree, '.env.local'), 'utf8')).toBe('CUSTOM=value')
    expect(fs.existsSync(path.join(worktree, '.env'))).toBe(false)
  })
  it.each([
    'DATABASE_URL=postgresql://u:p@ep-prod.neon.tech/db\nDEV_DATABASE_URL=postgresql://u:p@ep-dev.neon.tech/db',
    'DATABASE_URL=postgresql://u:p@ep-prod.neon.tech/db\nDEV_DATABASE_URL=postgresql://u:p@ep-prod-pooler.neon.tech/db\nPROD_DATABASE_URL=postgresql://u:p@ep-prod.neon.tech/db',
    'DATABASE_URL=not-a-url\nDEV_DATABASE_URL=not-a-url',
  ])('refuses to inherit unconfirmed or production database settings', async (env) => {
    fs.writeFileSync(path.join(main, '.env'), env)
    await expect(setupDevWorktree(worktree)).rejects.toThrow('DATABASE_URL')
    expect(fs.existsSync(path.join(worktree, '.env'))).toBe(false)
  })
  it('allows guest-only development without a shared env', async () => {
    await setupDevWorktree(worktree)
    expect(fs.existsSync(path.join(worktree, '.env'))).toBe(false)
  })
  it('leaves the main checkout untouched when dependencies match or no lockfile exists', async () => {
    await setupDevWorktree(main)
    expect(fs.lstatSync(path.join(main, 'node_modules')).isSymbolicLink()).toBe(false)
  })
  it('refreshes the main checkout when its node_modules are missing a locked package', async () => {
    const wanted = { '@tanstack/react-query': { version: '5.107.1' } }
    writeLockfile(main, wanted)
    writeInstalled(main, {})
    const installDeps = vi.fn((dir: string) => writeInstalled(dir, wanted))
    await setupDevWorktree(main, { dependenciesOnly: true, installDeps })
    expect(installDeps).toHaveBeenCalledWith(main)
    expect(nodeModulesSyncStatus(main).ok).toBe(true)
  })
  it('refreshes stale main dependencies before symlinking a new worktree', async () => {
    const wanted = { '@tanstack/react-query': { version: '5.107.1' } }
    writeLockfile(main, wanted)
    writeLockfile(worktree, wanted)
    writeInstalled(main, {})
    const installDeps = vi.fn((dir: string) => writeInstalled(dir, wanted))
    await setupDevWorktree(worktree, { dependenciesOnly: true, installDeps })
    expect(installDeps).toHaveBeenCalledTimes(1)
    expect(installDeps).toHaveBeenCalledWith(main)
    expect(fs.realpathSync(path.join(worktree, 'node_modules'))).toBe(fs.realpathSync(path.join(main, 'node_modules')))
  })
  it('installs local worktree dependencies instead of symlinking when lockfiles differ', async () => {
    const mainWanted = { '@tanstack/react-query': { version: '5.107.0' } }
    const worktreeWanted = { '@tanstack/react-query': { version: '5.107.1' } }
    writeLockfile(main, mainWanted)
    writeInstalled(main, mainWanted)
    writeLockfile(worktree, worktreeWanted)
    const installDeps = vi.fn((dir: string) => writeInstalled(dir, worktreeWanted))
    await setupDevWorktree(worktree, { dependenciesOnly: true, installDeps })
    expect(installDeps).toHaveBeenCalledTimes(1)
    expect(installDeps).toHaveBeenCalledWith(worktree)
    expect(fs.lstatSync(path.join(worktree, 'node_modules')).isSymbolicLink()).toBe(false)
  })
  it('refreshes or falls back locally when an existing symlinked node_modules falls out of sync', async () => {
    const wanted = { '@tanstack/react-query': { version: '5.107.1' } }
    writeLockfile(main, wanted)
    writeLockfile(worktree, wanted)
    writeInstalled(main, {})
    fs.symlinkSync(path.join(main, 'node_modules'), path.join(worktree, 'node_modules'), 'dir')
    const installDeps = vi.fn((dir: string) => {
      if (dir === main) throw new Error('EPERM')
      writeInstalled(dir, wanted)
    })
    await setupDevWorktree(worktree, { dependenciesOnly: true, installDeps })
    expect(installDeps).toHaveBeenNthCalledWith(1, main)
    expect(installDeps).toHaveBeenNthCalledWith(2, worktree)
    expect(fs.lstatSync(path.join(worktree, 'node_modules')).isSymbolicLink()).toBe(false)
    expect(nodeModulesSyncStatus(worktree).ok).toBe(true)
  })
  it('ignores uninstalled optional platform packages in package-lock.json', () => {
    const lock = {
      '@tanstack/react-query': { version: '5.107.1' },
      '@esbuild/linux-x64': { version: '0.25.12', optional: true },
    }
    writeLockfile(main, lock)
    writeInstalled(main, { '@tanstack/react-query': { version: '5.107.1' } })
    expect(nodeModulesSyncStatus(main)).toEqual({ ok: true, missing: [], mismatched: [] })
  })
})
