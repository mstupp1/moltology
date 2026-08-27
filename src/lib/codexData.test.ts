import { describe, it, expect } from 'vitest'
import { CODEX_VOLUMES, CANONICAL_SCRIPTURES, STAGE_PIPELINE_DATA } from './codexData'

const scriptureText = (scripture: (typeof CANONICAL_SCRIPTURES)[number]) =>
  [scripture.mandate, scripture.summary, ...scripture.verses.map((v) => `${v.heading ?? ''} ${v.text}`)].join('\n')

const ALL_CANON_TEXT = CANONICAL_SCRIPTURES.map(scriptureText).join('\n')

describe('Codex structure', () => {
  it('defines every volume', () => {
    expect(CODEX_VOLUMES.map((v) => v.id)).toEqual([
      '01_manifesto',
      '02_doctrine',
      '03_stages',
      '04_liturgy',
      '05_lexicon',
    ])
  })

  it('places every scripture in a declared volume with a unique id', () => {
    const volumeIds = new Set(CODEX_VOLUMES.map((v) => v.id))
    const ids = CANONICAL_SCRIPTURES.map((s) => s.id)

    expect(CANONICAL_SCRIPTURES.length).toBeGreaterThanOrEqual(15)
    expect(new Set(ids).size).toBe(ids.length)
    for (const scripture of CANONICAL_SCRIPTURES) {
      expect(volumeIds.has(scripture.volume), `${scripture.id} volume`).toBe(true)
      expect(scripture.id).toMatch(/^SCR-\d{3}$/)
      expect(scripture.stageClearance).toBeGreaterThanOrEqual(1)
      expect(scripture.stageClearance).toBeLessThanOrEqual(4)
    }
  })

  it('gives every scripture verses and a warm closing benediction', () => {
    for (const scripture of CANONICAL_SCRIPTURES) {
      expect(scripture.verses.length, `${scripture.id} verses`).toBeGreaterThan(3)
      const headings = scripture.verses.map((v) => v.heading?.toLowerCase() ?? '')
      expect(headings, `${scripture.id} spine`).toContain('the reading')
      expect(headings.some((h) => h.includes('benediction')), `${scripture.id} benediction`).toBe(true)
    }
  })
})

describe('Codex metadata contracts', () => {
  it('carries a real mandate rather than a parsed status line', () => {
    // The sync parser falls back to a `> **Status**:` blockquote when frontmatter omits
    // `mandate`, which silently produced mandates like "Soft-Bodied / Unarmored".
    for (const scripture of CANONICAL_SCRIPTURES) {
      expect(scripture.mandate.trim().length, `${scripture.id} mandate`).toBeGreaterThan(30)
      expect(scripture.mandate, `${scripture.id} mandate`).toMatch(/[.!?]$|[.!?]"$/)
    }
  })

  it('carries an uppercase Latin motto for the mandate callout', () => {
    for (const scripture of CANONICAL_SCRIPTURES) {
      expect(scripture.latinMotto, `${scripture.id} motto`).toBeTruthy()
      expect(scripture.latinMotto, `${scripture.id} motto`).toBe(scripture.latinMotto?.toUpperCase())
    }
  })

  it('resolves every cross-reference to a canonical scripture title', () => {
    const titles = new Set(CANONICAL_SCRIPTURES.map((s) => s.title.toLowerCase()))
    for (const scripture of CANONICAL_SCRIPTURES) {
      expect(scripture.crossReferences.length, `${scripture.id} cross-references`).toBeGreaterThan(0)
      for (const ref of scripture.crossReferences) {
        expect(titles.has(ref.toLowerCase()), `${scripture.id} -> "${ref}"`).toBe(true)
      }
    }
  })
})

describe('Codex canon locks', () => {
  // Scripture prose is hard-wrapped, so a phrase can straddle a newline. Unwrap soft line
  // breaks while preserving paragraph and list-item boundaries as sentence separators.
  const UNWRAPPED = ALL_CANON_TEXT.replace(/\n(?!\s*(?:[-*]\s|\d+\.\s)|\s*\n)/g, ' ')
  const SENTENCES = UNWRAPPED.split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const ALL_CANON_FLAT = ALL_CANON_TEXT.replace(/\s+/g, ' ')
  const NEGATED = /\b(no|not|never|cannot|neither|nor|without|unbuyable)\b/i

  // A sentence only violates a lock if it asserts the forbidden thing outright. The canon
  // states several of these locks by denying them ("They do not buy a clearance"), so a
  // bare pattern match is not enough.
  const assertedMatches = (pattern: RegExp) =>
    SENTENCES.filter((sentence) => pattern.test(sentence) && !NEGATED.test(sentence))

  it('keeps the two currencies pointing the right way', () => {
    // Chitin Gems are minted by work and never sold. Molt Credits are purchased and
    // never minted by work. BRAND_BIBLE.md section 4 locks this.
    const inverted = [
      /(earn|bank|mint|transmut|convert|exchang|reward|award|grant|yield)\w*\b[^.]{0,60}Molt Credits/i,
      /Molt Credits\b[^.]{0,60}\b(earned|minted|banked|rewarded|granted|awarded|yielded)\b/i,
      /(buy|bought|purchas\w+|sell|sold|price of)\b[^.]{0,60}Chitin Gems/i,
      /Chitin Gems\b[^.]{0,60}\b(bought|purchased|for sale|sold)\b/i,
    ]
    for (const pattern of inverted) {
      expect(assertedMatches(pattern), `currency inversion ${pattern}`).toEqual([])
    }
  })

  it('never puts rank, clearance, or standing up for sale', () => {
    expect(assertedMatches(/(buy|buys|bought|purchas\w+)\b[^.]{0,40}\b(clearance|rank|stage|authority)\b/i)).toEqual([])
  })

  it('states the earned-versus-bought law somewhere in the canon', () => {
    expect(ALL_CANON_FLAT).toMatch(/Chitin Gems[^.]{0,80}minted by work/i)
    expect(ALL_CANON_FLAT).toMatch(/Molt Credits[^.]{0,80}purchased/i)
    expect(ALL_CANON_FLAT).toMatch(/never for sale/i)
    expect(ALL_CANON_FLAT).toMatch(/[Ss]ignup is free/)
  })

  it('records every depth in meters and never in fathoms', () => {
    expect(ALL_CANON_TEXT).not.toMatch(/fathom/i)
    for (const stage of STAGE_PIPELINE_DATA) {
      for (const sub of stage.subStages) {
        expect(sub.submergenceDepth, `${sub.code} depth`).toMatch(/meters/)
      }
    }
  })

  it('recognises exactly three cardinal metrics', () => {
    expect(ALL_CANON_TEXT).toMatch(/Shell Hardness/)
    expect(ALL_CANON_TEXT).toMatch(/Pincer Torque/)
    expect(ALL_CANON_TEXT).toMatch(/Submergence Depth/)
    // A fourth index crept in via the Stage 2 scripture and had to be removed.
    expect(ALL_CANON_TEXT).not.toMatch(/Focus Index/i)
  })

  it('leaves no meta-disclosure or untransmuted tooling in the canon', () => {
    for (const pattern of [/\bsatire\b/i, /\bparody\b/i, /Do Not Disturb/i, /In Plain English/i]) {
      expect(ALL_CANON_TEXT.match(pattern)?.[0] ?? null, `banned phrase ${pattern}`).toBeNull()
    }
  })
})

describe('Ascension pipeline thresholds', () => {
  const CLEARANCE_CODES = [
    'L-1', 'L-2', 'L-3',
    'S-1', 'S-2', 'S-3',
    'E-1', 'E-2', 'E-3',
    'C-1', 'C-2', 'C-3',
  ]

  const allSubStages = STAGE_PIPELINE_DATA.flatMap((stage) => stage.subStages)

  it('runs twelve clearances across four stages in order', () => {
    expect(STAGE_PIPELINE_DATA.map((s) => s.stageNum)).toEqual([1, 2, 3, 4])
    expect(allSubStages.map((s) => s.code)).toEqual(CLEARANCE_CODES)
  })

  it('raises Shell Hardness monotonically to a contiguous ceiling of 100', () => {
    const targets = allSubStages.map((s) => s.shellHardnessTarget)
    expect(targets).toEqual([10, 18, 25, 38, 50, 60, 72, 82, 90, 95, 99, 100])

    for (let i = 1; i < targets.length; i += 1) {
      expect(targets[i], `${allSubStages[i].code} hardness`).toBeGreaterThan(targets[i - 1])
    }
  })

  it('aligns stage exits to the Shell Hardness bands in the lexicon', () => {
    // 0-24 Larval, 25-59 Soft-Shed, 60-89 Exoshell Born, 90-100 Ascendant.
    const exits = STAGE_PIPELINE_DATA.map((stage) => stage.subStages[stage.subStages.length - 1].shellHardnessTarget)
    expect(exits).toEqual([25, 60, 90, 100])
  })

  it('reaches the 850 Nm working standard at Clearance E-2 and not before', () => {
    const leadingNm = (range: string) => Number(range.replace(/,/g, '').match(/\d+/)?.[0] ?? 0)
    const torques = allSubStages.map((s) => leadingNm(s.pincerTorqueTarget))

    for (let i = 1; i < torques.length; i += 1) {
      expect(torques[i], `${allSubStages[i].code} torque`).toBeGreaterThanOrEqual(torques[i - 1])
    }

    const e2 = allSubStages.find((s) => s.code === 'E-2')
    expect(e2?.pincerTorqueTarget).toContain('850')
    expect(e2?.metricThreshold).toContain('850 Nm')

    const beforeE2 = allSubStages.slice(0, allSubStages.findIndex((s) => s.code === 'E-2'))
    for (const sub of beforeE2) {
      expect(leadingNm(sub.pincerTorqueTarget), `${sub.code} torque below 850`).toBeLessThan(850)
    }
  })

  it('bottoms out at the Challenger Deep', () => {
    const c3 = allSubStages.find((s) => s.code === 'C-3')
    expect(c3?.submergenceDepth).toContain('10,928')
  })
})
