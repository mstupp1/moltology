/**
 * Display copy for composites. Templates and scripts still hand us ALL-CAPS strings from the
 * old look; the current brand sets headlines and pills in sentence case (STYLE_GUIDE, homepage).
 * These helpers only touch text that is entirely upper case, so mixed-case copy passes through.
 */

/** Tokens that stay upper case after conversion (acronyms, units, product shorthand). */
const KEEP_UPPER = new Set([
  'AI', 'API', 'CPU', 'GPU', 'TPU', 'HBM', 'SRAM', 'DRAM', 'NVME', 'KV', 'MLA', 'MHA', 'CMX', 'OOM',
  'LLM', 'LLMS', 'RL', 'ML', 'UI', 'UX', 'CTA', 'PDF', 'FAQ', 'XP', 'DM', 'DMS', 'IRL', 'CEO', 'OS',
  'GB', 'TB', 'MB', 'NM', 'MS', 'GHZ', 'FPS', 'US', 'USA', 'UK', 'EU', 'Q1', 'Q2', 'Q3', 'Q4', 'ROPE',
  'TL;DR', 'OK', 'HUD', 'IQ', 'ID', 'II', 'III', 'IV',
])

/** Proper nouns from BRAND_BIBLE that keep their capital in sentence case. */
const PROPER_NOUNS: Record<string, string> = {
  moltology: 'Moltology',
  moltmaxxing: 'Moltmaxxing',
  moltmax: 'Moltmax',
  oracle: 'Oracle',
  synaptic: 'Synaptic',
  codex: 'Codex',
  liturgies: 'Liturgies',
  standing: 'Standing',
  premium: 'Premium',
  moltnation: 'MoltNation',
  'moltology.org': 'moltology.org',
}

const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu

/** Drop emoji: the brand look carries icons, not emoji. */
export function stripEmoji(text: string): string {
  return text.replace(EMOJI, '').replace(/\s{2,}/g, ' ').trim()
}

/** Shouty copy: nearly every letter upper case (allows a stray "vs." or "x"). */
const isAllCaps = (text: string) => {
  const upper = (text.match(/[A-Z]/g) || []).length
  const lower = (text.match(/[a-z]/g) || []).length
  return upper > 0 && lower <= 2 && upper >= 4 * lower
}

function caseWord(word: string): string {
  const core = word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9.;]+$/g, '')
  if (!core) return word.toLowerCase()
  const upper = core.toUpperCase()
  // Keep acronyms, plurals of acronyms (GPUs), units with digits (1M, 800NM) and ranks (C3).
  if (KEEP_UPPER.has(upper)) return word
  // Numbers keep short units (1M, 10X, 4GB); longer words glued to them drop case (2-MINUTE).
  if (/\d/.test(core)) return word.replace(/[A-Z]{3,}/g, (run) => (KEEP_UPPER.has(run) ? run : run.toLowerCase()))
  if (upper.endsWith('S') && KEEP_UPPER.has(upper.slice(0, -1))) {
    return word.replace(core, `${core.slice(0, -1)}s`)
  }
  const lower = word.toLowerCase()
  const proper = PROPER_NOUNS[core.toLowerCase()]
  return proper ? lower.replace(core.toLowerCase(), proper) : lower
}

/**
 * Sentence-case an ALL-CAPS line or a run of lines that read as one sentence
 * (e.g. a headline split over three props). Mixed-case input is returned unchanged.
 */
export function toSentenceCaseLines(lines: string[]): string[] {
  if (!lines.some((l) => l && isAllCaps(l))) return lines
  let sentenceStart = true
  return lines.map((line) => {
    if (!line || !isAllCaps(line)) {
      if (line) sentenceStart = /[.!?]\s*$/.test(line)
      return line
    }
    const out = line
      .split(/(\s+)/)
      .map((token) => {
        if (/^\s+$/.test(token) || !token) return token
        let word = caseWord(token)
        if (sentenceStart) {
          word = word.replace(/[A-Za-z]/, (c) => c.toUpperCase())
          sentenceStart = false
        }
        if (/[.!?:]["')\]]*$/.test(token)) sentenceStart = true
        return word
      })
      .join('')
    return out
  })
}

export function toSentenceCase(text: string | undefined): string {
  if (!text) return text ?? ''
  return toSentenceCaseLines([text])[0]
}

/** Pills, labels and body lines: sentence case plus no emoji. */
export function displayCopy(text: string | undefined): string {
  return toSentenceCase(stripEmoji(text ?? ''))
}
