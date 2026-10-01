/**
 * Reel Director
 *
 * Makes the 6 Veo scenes read as one piece instead of six unrelated stock shots:
 *  - splits the narration into beats so each scene illustrates the line spoken over it,
 *  - times every cut to a sentence boundary using the voiceover word timestamps,
 *  - sizes each Veo clip to its beat (4, 6 or 8s) so credits are not spent on footage that gets trimmed,
 *  - writes a beat-matched shot list with one recurring protagonist and one recurring hero (Gemini text),
 *  - falls back to the curated scene pools plus a shared continuity layer when the director call fails.
 */
import type { WordBoundaryEvent } from './tts-engine'

/** Clip lengths Veo 3.1 accepts. */
export const VEO_CLIP_DURATIONS = [4, 6, 8] as const
/** How much slow motion a scene may take before we pay for a longer clip. 1.35x still reads as cinematic. */
export const MAX_SLOW_MOTION = 1.35
/** Shortest scene we allow on screen; shorter beats fall back to even cuts. */
export const MIN_BEAT_SECONDS = 2

/** Tried in order; a 404 (model retired for this key) moves on to the next. */
export const DIRECTOR_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3-flash-preview']

/** Things Veo likes to add that fight the burned-in captions or look broken. Scenes only, never the outro card. */
export const SCENE_NEGATIVE_PROMPT =
  'on-screen text, captions, subtitles, readable signs, logos, watermarks, garbled letters, distorted hands, extra limbs, warped faces, low quality, blurry'

export interface ContinuityBible {
  /** Recurring person in the terrestrial half (scenes 1-3). */
  protagonist: string
  /** Recurring cybernetic crustacean in the benthic half (scenes 4-6). */
  hero: string
}

export const DEFAULT_CONTINUITY: ContinuityBible = {
  protagonist:
    'a tired office worker in their early thirties, short dark hair, rumpled navy hoodie over a white collared shirt, lanyard badge',
  hero: 'a sleek cybernetic lobster with a glossy deep-teal titanium-chitin carapace, cyan seam lights, and oversized polished pincers',
}

const SHARED_LOOK =
  'Photoreal, shot on a 35mm anamorphic lens, shallow depth of field, gentle film grain, one continuous shot with a slow motivated camera move. No on-screen text, captions, or logos.'

const PERSON_PATTERN = /\b(worker|engineer|executive|professional|person|technician|customer|guest|family|researcher|pedestrian|employee|operator)s?\b/i
const CRUSTACEAN_PATTERN = /\b(crustacean|lobster|crab|initiate)s?\b/i

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

/** Sentence split that keeps "moltology.org" and decimals intact (a break needs whitespace after the mark). */
export function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+(?=["'“‘(]?[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function splitLongestUnit(units: string[]): string[] | null {
  let longestIdx = -1
  let longestWords = 0
  units.forEach((u, i) => {
    const w = countWords(u)
    if (w > longestWords) {
      longestWords = w
      longestIdx = i
    }
  })
  if (longestIdx < 0 || longestWords < 4) return null

  const unit = units[longestIdx]
  const words = unit.split(/\s+/)
  // Prefer a clause break (comma, semicolon, dash) nearest the middle, else the word midpoint.
  const mid = words.length / 2
  let splitAt = -1
  let bestDistance = Infinity
  words.forEach((w, i) => {
    if (i === words.length - 1) return
    if (/[,;:—–]$/.test(w)) {
      const d = Math.abs(i + 1 - mid)
      if (d < bestDistance) {
        bestDistance = d
        splitAt = i + 1
      }
    }
  })
  if (splitAt < 2 || splitAt > words.length - 2) splitAt = Math.round(mid)

  return [
    ...units.slice(0, longestIdx),
    words.slice(0, splitAt).join(' '),
    words.slice(splitAt).join(' '),
    ...units.slice(longestIdx + 1),
  ]
}

/**
 * Split narration into `numBeats` contiguous beats, balanced by word count, breaking only between sentences
 * (or at clauses when there are fewer sentences than beats).
 */
export function splitNarrationIntoBeats(script: string, numBeats = 6): string[] {
  let units = splitIntoSentences(script)
  if (units.length === 0 || numBeats <= 1) return [units.join(' ')]

  while (units.length < numBeats) {
    const next = splitLongestUnit(units)
    if (!next) break
    units = next
  }
  if (units.length <= numBeats) return units

  // Contiguous partition minimizing squared deviation from the even word target (small DP: <= ~30 units).
  const counts = units.map(countWords)
  const total = counts.reduce((a, b) => a + b, 0)
  const target = total / numBeats
  const n = units.length
  const prefix = [0]
  counts.forEach((c) => prefix.push(prefix[prefix.length - 1] + c))

  const cost: number[][] = Array.from({ length: numBeats + 1 }, () => Array(n + 1).fill(Infinity))
  const prev: number[][] = Array.from({ length: numBeats + 1 }, () => Array(n + 1).fill(-1))
  cost[0][0] = 0
  for (let k = 1; k <= numBeats; k++) {
    for (let j = k; j <= n - (numBeats - k); j++) {
      for (let i = k - 1; i < j; i++) {
        if (cost[k - 1][i] === Infinity) continue
        const words = prefix[j] - prefix[i]
        const c = cost[k - 1][i] + (words - target) ** 2
        if (c < cost[k][j]) {
          cost[k][j] = c
          prev[k][j] = i
        }
      }
    }
  }

  const beats: string[] = []
  let j = n
  for (let k = numBeats; k >= 1; k--) {
    const i = prev[k][j]
    beats.unshift(units.slice(i, j).join(' '))
    j = i
  }
  return beats
}

function evenDurations(total: number, n: number): number[] {
  return Array(n).fill(total / n)
}

/**
 * Scene durations whose cuts land in the pause before each beat's first word.
 * Beat starts are mapped onto the TTS word stream by word-count proportion, which tolerates
 * the TTS tokenizing differently ("moltology.org" vs "moltology dot org").
 * Falls back to even cuts when timestamps are missing or a beat would be shorter than MIN_BEAT_SECONDS.
 */
export function computeBeatDurations(beats: string[], words: WordBoundaryEvent[], totalSceneDuration: number): number[] {
  const n = beats.length
  if (n <= 1) return [totalSceneDuration]
  if (!words || words.length < n * 2) return evenDurations(totalSceneDuration, n)

  const beatWords = beats.map(countWords)
  const totalWords = beatWords.reduce((a, b) => a + b, 0)
  if (totalWords === 0) return evenDurations(totalSceneDuration, n)

  const cuts: number[] = [0]
  let cumulative = 0
  for (let k = 0; k < n - 1; k++) {
    cumulative += beatWords[k]
    const idx = Math.min(words.length - 1, Math.max(1, Math.round((cumulative / totalWords) * words.length)))
    const gapStart = words[idx - 1].endMs / 1000
    const nextStart = words[idx].startMs / 1000
    cuts.push(nextStart > gapStart ? (gapStart + nextStart) / 2 : nextStart)
  }
  cuts.push(totalSceneDuration)

  const durations: number[] = []
  for (let k = 0; k < n; k++) durations.push(cuts[k + 1] - cuts[k])
  if (durations.some((d) => !(d >= MIN_BEAT_SECONDS))) return evenDurations(totalSceneDuration, n)
  return durations
}

/** Shortest Veo clip that covers the beat with at most MAX_SLOW_MOTION stretch. */
export function pickVeoClipDuration(targetSeconds: number): number {
  for (const d of VEO_CLIP_DURATIONS) {
    if (d * MAX_SLOW_MOTION >= targetSeconds) return d
  }
  return VEO_CLIP_DURATIONS[VEO_CLIP_DURATIONS.length - 1]
}

/**
 * Shared look + recurring characters layered onto curated pool prompts (used when the director call is off or fails).
 * Characters are only added where the prompt already features a person or a crustacean, so macro shots stay macro.
 */
export function applyContinuity(prompts: string[], bible: ContinuityBible = DEFAULT_CONTINUITY): string[] {
  const half = Math.ceil(prompts.length / 2)
  return prompts.map((raw, i) => {
    const base = raw.replace(/,?\s*cinematic 9:16 vertical 8k footage\.?\s*$/i, '').trim()
    const parts = [`Vertical 9:16 shot. ${base}.`]
    if (i < half && PERSON_PATTERN.test(base)) parts.push(`The main person is ${bible.protagonist}.`)
    if (i >= half && CRUSTACEAN_PATTERN.test(base)) parts.push(`The featured crustacean is ${bible.hero}.`)
    parts.push(i < half ? 'Warm, slightly harsh practical lighting.' : 'Cool deep-ocean cyan and indigo light with drifting particles.')
    parts.push(SHARED_LOOK)
    return parts.join(' ')
  })
}

export function buildDirectorInstructions(numScenes: number): string {
  const half = Math.ceil(numScenes / 2)
  return [
    `You are the director of a ${numScenes}-shot vertical (9:16) short video. A narrator reads a script over the shots; each shot plays under exactly one beat of that script.`,
    'Write one Veo video-generation prompt per beat so the viewer sees what they are hearing, and the shots flow as one story.',
    '',
    'Story shape:',
    `- Shots 1-${half - 1 > 0 ? half - 1 : 1}: the everyday human world, photoreal and relatable, warm practical lighting. Shot 1 must grab attention in the first second with a clear, specific visual.`,
    `- Shot ${half}: the frustration peaks; the human world visibly breaks down (comic, never scary).`,
    `- Shot ${half + 1}: the transition. The camera pushes into something from the previous shot (a monitor, a coffee surface, a window, a floor drain) and emerges deep underwater in cool cyan light.`,
    `- Shots ${half + 1}-${numScenes}: the deep-sea benthic world of cybernetic crustaceans, luminous and calm, cool cyan and indigo.`,
    `- Shot ${numScenes}: ends calm and centered on the hero facing camera, a clean frame to cut to a call-to-action card.`,
    '',
    'Continuity:',
    '- Invent ONE human protagonist and ONE cybernetic crustacean hero. Describe each in one specific line (age range, hair, clothing colors; carapace color, lights, pincers).',
    '- Repeat that exact description, word for word, in every shot where they appear. The protagonist appears in most human-world shots; the hero in most deep-sea shots.',
    '- Keep one consistent look: photoreal, 35mm anamorphic lens, shallow depth of field, gentle film grain.',
    '',
    'Each prompt:',
    '- One continuous 4-8 second shot, no cuts. Name the shot size, one camera move, the subject, the action, and the lighting.',
    '- 45-90 words, plain visual description. Comedy is deadpan and visual.',
    '- No on-screen text, captions, readable signs, screens with readable words, logos, real brands, or real people.',
    '- Nothing gory, violent, or frightening. People are safe and fine.',
    '',
    'Return JSON only: {"protagonist": string, "hero": string, "scenes": [string x ' + numScenes + ']}',
  ].join('\n')
}

export function buildDirectorRequest(beats: string[], topic: string, hints: string[]): string {
  const lines = [`Topic: ${topic}`, '', 'Beats (narration spoken over each shot):']
  beats.forEach((b, i) => lines.push(`${i + 1}. "${b}"`))
  if (hints.length) {
    lines.push('', 'Reference settings you may borrow from (optional):')
    hints.forEach((h, i) => lines.push(`${i + 1}. ${h.replace(/,?\s*cinematic 9:16 vertical 8k footage\.?\s*$/i, '')}`))
  }
  return lines.join('\n')
}

export interface DirectedShotList {
  bible: ContinuityBible
  prompts: string[]
}

/** Validates the director's JSON. Returns null when anything is off so the caller can fall back. */
export function parseDirectorResponse(raw: string, numScenes: number): DirectedShotList | null {
  let data: any
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
    data = JSON.parse(cleaned)
  } catch {
    return null
  }
  if (!data || !Array.isArray(data.scenes) || data.scenes.length !== numScenes) return null
  const scenes = data.scenes.map((s: unknown) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : ''))
  if (scenes.some((s: string) => countWords(s) < 15 || s.length > 1200)) return null
  const protagonist = typeof data.protagonist === 'string' && data.protagonist.trim() ? data.protagonist.trim() : DEFAULT_CONTINUITY.protagonist
  const hero = typeof data.hero === 'string' && data.hero.trim() ? data.hero.trim() : DEFAULT_CONTINUITY.hero
  return {
    bible: { protagonist, hero },
    prompts: scenes.map((s: string) => {
      const framed = /^vertical 9:16/i.test(s) ? s : `Vertical 9:16 shot. ${s}`
      return /no on-screen text/i.test(framed) ? framed : `${framed} No on-screen text or logos.`
    }),
  }
}

export interface DirectScenesOptions {
  beats: string[]
  topic: string
  /** Curated pool prompts: used as setting hints for the director and as the fallback shot list. */
  fallbackPrompts: string[]
  apiKey?: string
  model?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export interface DirectScenesResult {
  prompts: string[]
  bible: ContinuityBible
  source: 'director' | 'fallback'
  model?: string
  reason?: string
}

/**
 * Ask Gemini (text, a fraction of a cent) for a beat-matched shot list before spending Veo credits.
 * Never throws: any failure returns the curated prompts with the continuity layer applied.
 */
export async function directScenePrompts(options: DirectScenesOptions): Promise<DirectScenesResult> {
  const numScenes = options.fallbackPrompts.length
  const fallback = (reason: string): DirectScenesResult => ({
    prompts: applyContinuity(options.fallbackPrompts),
    bible: DEFAULT_CONTINUITY,
    source: 'fallback',
    reason,
  })

  const apiKey = options.apiKey ?? (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
  if (!apiKey) return fallback('no Gemini API key')
  if (options.beats.length !== numScenes) return fallback(`beat count ${options.beats.length} does not match ${numScenes} scenes`)

  const envModel = process.env.REEL_DIRECTOR_MODEL
  const models = options.model ? [options.model] : envModel ? [envModel, ...DIRECTOR_MODELS] : DIRECTOR_MODELS
  const doFetch = options.fetchImpl || fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 90000)
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: buildDirectorInstructions(numScenes) }] },
    contents: [{ role: 'user', parts: [{ text: buildDirectorRequest(options.beats, options.topic, options.fallbackPrompts) }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.9 },
  })

  try {
    let lastReason = 'no director model available'
    for (const model of models) {
      const res = await doFetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body,
      })
      if (!res.ok) {
        lastReason = `director call failed on ${model} (${res.status})`
        if (res.status === 404) continue
        return fallback(lastReason)
      }
      const data = (await res.json()) as any
      const text: string = (data?.candidates?.[0]?.content?.parts || [])
        .filter((p: any) => !p?.thought)
        .map((p: any) => p?.text || '')
        .join('')
      const parsed = parseDirectorResponse(text, numScenes)
      if (!parsed) return fallback(`director (${model}) returned an unusable shot list`)
      return { ...parsed, source: 'director', model }
    }
    return fallback(lastReason)
  } catch (err: any) {
    return fallback(`director call errored: ${err?.message || err}`)
  } finally {
    clearTimeout(timer)
  }
}
