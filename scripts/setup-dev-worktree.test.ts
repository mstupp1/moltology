import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { setupDevWorktree } from './setup-dev-worktree.mjs'

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
  it('leaves the main checkout untouched', async () => {
    await setupDevWorktree(main)
    expect(fs.lstatSync(path.join(main, 'node_modules')).isSymbolicLink()).toBe(false)
  })
})
