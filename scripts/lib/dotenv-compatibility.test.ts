import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { config } from 'dotenv'
import { afterAll, describe, expect, it } from 'vitest'

const directory = mkdtempSync(join(tmpdir(), 'moltology-dotenv-'))
const envPath = join(directory, '.env')
writeFileSync(envPath, [
  'MOLT_DOTENV_EXISTING=from-file',
  'MOLT_DOTENV_EMPTY=',
  'MOLT_DOTENV_QUOTED="value#with-hash"',
  'MOLT_DOTENV_MULTILINE="first\\nsecond"',
].join('\n'))
afterAll(() => rmSync(directory, { recursive: true, force: true }))

describe('dotenv upgrade compatibility', () => {
  it('preserves shell values while loading blank, quoted and multiline values', () => {
    const target = { MOLT_DOTENV_EXISTING: 'from-shell' }
    const result = config({ path: envPath, processEnv: target, quiet: true })
    expect(result.error).toBeUndefined()
    expect(target).toEqual({
      MOLT_DOTENV_EXISTING: 'from-shell',
      MOLT_DOTENV_EMPTY: '',
      MOLT_DOTENV_QUOTED: 'value#with-hash',
      MOLT_DOTENV_MULTILINE: 'first\nsecond',
    })
  })

  it('keeps dotenv/config side-effect imports quiet and loads the working-directory file', () => {
    const require = createRequire(import.meta.url)
    const output = execFileSync(process.execPath, [
      '--import', require.resolve('dotenv/config'),
      '-e', 'console.log(JSON.stringify({existing:process.env.MOLT_DOTENV_EXISTING,quoted:process.env.MOLT_DOTENV_QUOTED}))',
    ], { cwd: directory, env: { MOLT_DOTENV_EXISTING: 'from-shell' }, encoding: 'utf8' })
    expect(JSON.parse(output)).toEqual({ existing: 'from-shell', quoted: 'value#with-hash' })
  })

  it('reports a missing optional file without changing supplied values', () => {
    const target = { MOLT_DOTENV_EXISTING: 'from-shell' }
    const result = config({ path: join(directory, 'missing.env'), processEnv: target, quiet: true })
    expect(result.error).toMatchObject({ code: 'ENOENT' })
    expect(target).toEqual({ MOLT_DOTENV_EXISTING: 'from-shell' })
  })
})
