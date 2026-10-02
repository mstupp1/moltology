import { describe, it, expect } from 'vitest'
import {
  splitIntoSentences,
  splitNarrationIntoBeats,
  computeBeatDurations,
  pickVeoClipDuration,
  applyContinuity,
  parseDirectorResponse,
  directScenePrompts,
  countWords,
  DEFAULT_CONTINUITY,
} from './reel-director'
import type { WordBoundaryEvent } from './tts-engine'

const SCRIPT =
  'If you are still following vanity wellness trends while your focus collapses at your desk by two in the afternoon, listen closely. ' +
  'You sit under buzzing fluorescent lights, drinking cold coffee, watching fragile human hands tremble over keyboards. ' +
  'Looksmaxxing was vanity. Meltmaxxing revealed soft biological bodies breaking down under exascale cognitive load. ' +
  'Moltmaxxing is the engineered convergence on bio-silicon invulnerability. We do not negotiate with fatigue. ' +
  'We calibrate eight hundred newton-meters of hydraulic pincer grip fifty thousand fathoms beneath the waves. ' +
  'Stop melting into your office chair. Comment QUIZ to calculate your molt clearance on moltology.org.'

function fakeWords(text: string, wordMs = 350, sentencePauseMs = 300): WordBoundaryEvent[] {
  const out: WordBoundaryEvent[] = []
  let t = 0
  for (const w of text.split(/\s+/).filter(Boolean)) {
    out.push({ word: w, startMs: t, endMs: t + wordMs, durationMs: wordMs })
    t += wordMs + (/[.!?]$/.test(w) ? sentencePauseMs : 40)
  }
  return out
}

describe('splitIntoSentences', () => {
  it('keeps domains and decimals inside a sentence', () => {
    expect(splitIntoSentences('Visit moltology.org today. It costs 2.5 credits. Done!')).toEqual([
      'Visit moltology.org today.',
      'It costs 2.5 credits.',
      'Done!',
    ])
  })
})

describe('splitNarrationIntoBeats', () => {
  it('returns the requested number of beats, in order, without losing words', () => {
    const beats = splitNarrationIntoBeats(SCRIPT, 6)
    expect(beats).toHaveLength(6)
    expect(beats.join(' ')).toBe(SCRIPT.replace(/\s+/g, ' ').trim())
  })

  it('only breaks between sentences when there are enough sentences', () => {
    const beats = splitNarrationIntoBeats(SCRIPT, 6)
    for (const b of beats) expect(b).toMatch(/[.!?]$/)
  })

  it('balances beats by word count', () => {
    const counts = splitNarrationIntoBeats(SCRIPT, 6).map(countWords)
    expect(Math.max(...counts)).toBeLessThanOrEqual(Math.min(...counts) * 3)
  })

  it('splits long sentences at clauses when there are fewer sentences than beats', () => {
    const beats = splitNarrationIntoBeats(
      'Your hands shake, your coffee is cold, and the deadline is near. Down here, the water is calm, the armor is hard, and the grip holds.',
      6
    )
    expect(beats).toHaveLength(6)
    expect(beats.join(' ')).toContain('the grip holds.')
  })
})

describe('computeBeatDurations', () => {
  it('cuts in the pause before each beat and fills the scene length exactly', () => {
    const beats = splitNarrationIntoBeats(SCRIPT, 6)
    const words = fakeWords(SCRIPT)
    const total = words[words.length - 1].endMs / 1000 + 0.8
    const durations = computeBeatDurations(beats, words, total)
    expect(durations).toHaveLength(6)
    expect(durations.reduce((a, b) => a + b, 0)).toBeCloseTo(total, 5)

    // Each cut sits between the last word of one beat and the first word of the next.
    let cut = 0
    let wordIdx = 0
    for (let k = 0; k < beats.length - 1; k++) {
      cut += durations[k]
      wordIdx += countWords(beats[k])
      expect(cut).toBeGreaterThanOrEqual(words[wordIdx - 1].endMs / 1000)
      expect(cut).toBeLessThanOrEqual(words[wordIdx].startMs / 1000)
    }
  })

  it('falls back to even cuts without timestamps', () => {
    expect(computeBeatDurations(['a b.', 'c d.'], [], 10)).toEqual([5, 5])
  })

  it('falls back to even cuts when a beat would be too short', () => {
    const beats = ['One.', 'Two three four five six seven eight nine ten eleven twelve.']
    const words = fakeWords(beats.join(' '), 100, 0)
    const durations = computeBeatDurations(beats, words, 10)
    expect(durations).toEqual([5, 5])
  })
})

describe('pickVeoClipDuration', () => {
  it('picks the shortest Veo length that covers the beat with modest slow motion', () => {
    expect(pickVeoClipDuration(3)).toBe(4)
    expect(pickVeoClipDuration(5.3)).toBe(4)
    expect(pickVeoClipDuration(5.6)).toBe(6)
    expect(pickVeoClipDuration(7.8)).toBe(6)
    expect(pickVeoClipDuration(8.5)).toBe(8)
    expect(pickVeoClipDuration(14)).toBe(8)
  })
})

describe('applyContinuity', () => {
  const pool = [
    'A realistic corporate open-plan floor with busy professionals typing, cinematic 9:16 vertical 8k footage',
    'A dramatic macro view of an overheating server rack, cinematic 9:16 vertical 8k footage',
    'A majestic 3D cybernetic crustacean initiate locking pincers onto hardware, cinematic 9:16 vertical 8k footage',
    'A tranquil deep ocean trench, cinematic 9:16 vertical 8k footage',
  ]
  const styled = applyContinuity(pool)

  it('adds the recurring protagonist only to human-world shots with people', () => {
    expect(styled[0]).toContain(DEFAULT_CONTINUITY.protagonist)
    expect(styled[1]).not.toContain(DEFAULT_CONTINUITY.protagonist)
  })

  it('adds the recurring hero only to deep-sea shots with a crustacean', () => {
    expect(styled[2]).toContain(DEFAULT_CONTINUITY.hero)
    expect(styled[3]).not.toContain(DEFAULT_CONTINUITY.hero)
  })

  it('replaces the stock suffix with a shared look and a no-text rule', () => {
    for (const p of styled) {
      expect(p).not.toMatch(/8k footage/)
      expect(p).toMatch(/No on-screen text/)
    }
  })
})

describe('parseDirectorResponse', () => {
  const scene = 'Vertical 9:16 medium shot. The camera pushes in slowly on a tired engineer at a cluttered desk under warm lamps as coffee goes cold.'

  it('accepts a valid shot list', () => {
    const parsed = parseDirectorResponse(JSON.stringify({ protagonist: 'p', hero: 'h', scenes: [scene, scene] }), 2)
    expect(parsed?.prompts).toHaveLength(2)
    expect(parsed?.bible).toEqual({ protagonist: 'p', hero: 'h' })
    expect(parsed?.prompts[0]).toMatch(/No on-screen text/)
  })

  it('rejects the wrong scene count, thin prompts, or bad JSON', () => {
    expect(parseDirectorResponse(JSON.stringify({ scenes: [scene] }), 2)).toBeNull()
    expect(parseDirectorResponse(JSON.stringify({ scenes: [scene, 'too short'] }), 2)).toBeNull()
    expect(parseDirectorResponse('not json', 2)).toBeNull()
  })
})

describe('directScenePrompts', () => {
  const beats = ['Beat one.', 'Beat two.']
  const fallbackPrompts = ['An office worker at a desk, cinematic 9:16 vertical 8k footage', 'A cybernetic lobster, cinematic 9:16 vertical 8k footage']
  const scene = 'Vertical 9:16 medium shot. The camera pushes in slowly on a tired engineer at a cluttered desk under warm lamps as coffee goes cold.'

  const respond = (status: number, body: unknown) =>
    (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

  it('uses the director shot list when the call succeeds', async () => {
    const fetchImpl = respond(200, {
      candidates: [{ content: { parts: [{ text: JSON.stringify({ protagonist: 'p', hero: 'h', scenes: [scene, scene] }) }] } }],
    })
    const result = await directScenePrompts({ beats, topic: 't', fallbackPrompts, apiKey: 'k', fetchImpl })
    expect(result.source).toBe('director')
    expect(result.prompts).toHaveLength(2)
  })

  it('moves to the next model when one is retired (404)', async () => {
    const calls: string[] = []
    const fetchImpl = (async (url: string) => {
      calls.push(url)
      if (calls.length === 1) return new Response('{}', { status: 404 })
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ scenes: [scene, scene] }) }] } }] }),
        { status: 200 }
      )
    }) as unknown as typeof fetch
    const result = await directScenePrompts({ beats, topic: 't', fallbackPrompts, apiKey: 'k', fetchImpl })
    expect(calls).toHaveLength(2)
    expect(result.source).toBe('director')
  })

  it('falls back to continuity-styled curated prompts on failure', async () => {
    const result = await directScenePrompts({ beats, topic: 't', fallbackPrompts, apiKey: 'k', fetchImpl: respond(500, {}) })
    expect(result.source).toBe('fallback')
    expect(result.prompts[0]).toContain(DEFAULT_CONTINUITY.protagonist)
  })

  it('falls back without an API key', async () => {
    const result = await directScenePrompts({ beats, topic: 't', fallbackPrompts, apiKey: '' })
    expect(result.source).toBe('fallback')
  })

  it('binds canonical Composite Studio mascots to the hero in directScenePrompts', async () => {
    const result = await directScenePrompts({
      beats,
      topic: 't',
      fallbackPrompts,
      mascot: 'lobster_engineer',
      apiKey: '',
    })
    expect(result.source).toBe('fallback')
    expect(result.bible.mascotKey).toBe('lobster_engineer')
    expect(result.bible.hero).toContain('yellow safety hardhat')
    expect(result.bible.hero).toContain('holographic diagnostic tablet')
    expect(result.prompts[1]).toContain('yellow safety hardhat')
  })
})

describe('resolveHeroForMascot', () => {
  it('resolves canonical mascots and common aliases', async () => {
    const { resolveHeroForMascot } = await import('./reel-director')
    expect(resolveHeroForMascot('lobster_engineer')?.key).toBe('lobster_engineer')
    expect(resolveHeroForMascot('engineer')?.key).toBe('lobster_engineer')
    expect(resolveHeroForMascot('crab_stats')?.key).toBe('crab_stats')
    expect(resolveHeroForMascot('stats')?.key).toBe('crab_stats')
    expect(resolveHeroForMascot('lobster_navigator')?.key).toBe('lobster_navigator')
    expect(resolveHeroForMascot('explorer')?.key).toBe('lobster_navigator')
    expect(resolveHeroForMascot('lobster_peaceful')?.key).toBe('lobster_peaceful')
    expect(resolveHeroForMascot('zen')?.key).toBe('lobster_peaceful')
    expect(resolveHeroForMascot('none')).toBeNull()
    expect(resolveHeroForMascot('random')).toBeNull()
  })
})

