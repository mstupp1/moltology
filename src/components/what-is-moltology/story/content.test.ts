import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MEMBER_VOICES, SACRAMENTS, STAGES } from './content'
import { filterVoices } from '../WhatMoltologistsSayPage'

const dir = join(__dirname, '..')
const sources = [
  'story/content.ts',
  'WhatIsMoltologyHubPage.tsx',
  'BeliefsAndCodesPage.tsx',
  'BenthicSacramentsPage.tsx',
  'WhatMoltologistsSayPage.tsx',
].map((file) => readFileSync(join(dir, file), 'utf8'))

describe('About page copy', () => {
  it('keeps the canon shape: four stages, twelve clearances, four sacraments', () => {
    expect(STAGES).toHaveLength(4)
    expect(STAGES.flatMap((stage) => stage.clearances.map((c) => c.code))).toEqual([
      'L1', 'L2', 'L3', 'S1', 'S2', 'S3', 'E1', 'E2', 'E3', 'C1', 'C2', 'C3',
    ])
    expect(SACRAMENTS.map((s) => s.number)).toEqual(['01', '02', '03', '04'])
  })

  it('avoids the purchase refrain, diamond glyphs, and bit-breaking words', () => {
    const banned = [/never bought/i, /can never be bought/i, /never for sale/i, /never sold/i, /◈/, /\bactually\b/i]
    for (const source of sources) {
      for (const pattern of banned) expect(source).not.toMatch(pattern)
    }
  })
})

describe('filterVoices', () => {
  it('returns every voice for "all" and only matching stages otherwise', () => {
    expect(filterVoices(MEMBER_VOICES, 'all')).toHaveLength(MEMBER_VOICES.length)
    const larval = filterVoices(MEMBER_VOICES, 'larval')
    expect(larval.length).toBeGreaterThan(0)
    expect(larval.every((voice) => voice.stage === 'larval')).toBe(true)
  })
})
