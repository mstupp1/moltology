import fs from 'node:fs'
import path from 'node:path'
import { edgeProvider } from './tts-providers/edge'
import { fishProvider, isFishConfigured } from './tts-providers/fish-audio'
import type { ProviderGenerationOptions } from './tts-providers/types'

export type TTSProviderName = 'auto' | 'fish' | 'edge'

export interface WordBoundaryEvent {
  word: string
  startMs: number
  endMs: number
  durationMs: number
  isSentenceEnd?: boolean
  isClauseEnd?: boolean
  pauseToNextMs?: number
}

export interface TTSGenerationOptions {
  voice?: string
  rate?: string // e.g. "+5%", "+10%", "-5%"
  pitch?: string // e.g. "+0Hz", "-5Hz"
  outputDir?: string
  outputFilename?: string
  provider?: TTSProviderName
  referenceId?: string // Fish voice model id (overrides env default)
  model?: string // Fish model, default s2.1-pro
}

export interface TTSGenerationResult {
  audioPath: string
  durationSeconds: number
  words: WordBoundaryEvent[]
  assSubtitlesPath?: string
  srtSubtitlesPath?: string
  providerUsed?: 'fish' | 'edge'
}

/**
 * Format milliseconds to ASS timestamp (H:MM:SS.cc)
 */
export function formatAssTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((ms % 1000) / 10)

  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}

/**
 * Format milliseconds to SRT timestamp (HH:MM:SS,mmm)
 */
export function formatSrtTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const milliseconds = ms % 1000

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`
}

/**
 * Tokenize script text into matchable words while preserving punctuation,
 * sentence endings, and splitting hyphenated/dashed compound words into sub-tokens.
 */
/**
 * Tokenize script text into matchable words while preserving punctuation,
 * sentence endings, and splitting hyphenated/dashed compound words into sub-tokens.
 */
export function tokenizeScriptText(text: string): string[] {
  if (!text) return []
  // Normalize any spoken domain phrases like "moltology dot org" to "moltology.org"
  const normalized = text.replace(/moltology\s+dot\s+org\b/gi, 'moltology.org')
  const rawWords = normalized.trim().split(/\s+/).filter(Boolean)
  const tokens: string[] = []

  for (const raw of rawWords) {
    // Check if word contains intra-word hyphens, en-dashes, em-dashes, or slashes (e.g. "titanium-chitin", "bio-silicon,", "pressure—calcify")
    // but preserve domains like "moltology.org" or decimal numbers
    const subParts = raw.split(/(?<=[a-zA-Z0-9])([—–\-\/]+)(?=[a-zA-Z0-9])/g).filter(Boolean)

    if (subParts.length <= 1) {
      tokens.push(raw)
      continue
    }

    let current = ''
    for (let i = 0; i < subParts.length; i++) {
      const part = subParts[i]
      if (/^[—–\-\/]+$/.test(part)) {
        current += part
        tokens.push(current)
        current = ''
      } else {
        if (current) {
          tokens.push(current)
        }
        current = part
      }
    }
    if (current) {
      tokens.push(current)
    }
  }

  return tokens.filter(Boolean)
}

/**
 * Align raw word boundary events with original script text to preserve punctuation,
 * sentence boundaries, and maintain synchronization across hyphenated compounds and multi-word spoken domains.
 */
export function alignWordsWithOriginalText(
  words: WordBoundaryEvent[],
  originalText: string
): WordBoundaryEvent[] {
  if (!originalText || words.length === 0) return words

  const originalTokens = tokenizeScriptText(originalText)
  let tokenIdx = 0

  const alignedWords: WordBoundaryEvent[] = []

  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    let matchedToken = ''
    const cleanWord = w.word.toLowerCase().replace(/[^a-z0-9]/g, '')

    let matchedOffset = -1
    let tokensToConsume = 1
    let wordsToConsume = 1

    for (let offset = 0; offset < 4 && tokenIdx + offset < originalTokens.length; offset++) {
      const candidate = originalTokens[tokenIdx + offset]
      const cleanCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, '')

      if (cleanCandidate === cleanWord) {
        matchedToken = candidate
        matchedOffset = offset
        tokensToConsume = 1
        break
      }

      // Check if candidate is a domain or compound where multiple spoken words map to this single candidate token
      // e.g. candidate is "moltology.org." (cleanCandidate: "moltologyorg") and words[i..i+2] are "moltology", "dot", "org"
      if (cleanCandidate.length > cleanWord.length && (cleanCandidate.startsWith(cleanWord) || cleanCandidate.includes(cleanWord))) {
        let combinedSpokenClean = cleanWord
        let spokenLookAhead = 1

        while (i + spokenLookAhead < words.length && spokenLookAhead <= 3) {
          const nextSpoken = words[i + spokenLookAhead].word.toLowerCase().replace(/[^a-z0-9]/g, '')
          combinedSpokenClean += nextSpoken
          spokenLookAhead++

          const strippedDotCombined = combinedSpokenClean.replace(/dot/g, '')
          if (
            combinedSpokenClean === cleanCandidate ||
            strippedDotCombined === cleanCandidate ||
            combinedSpokenClean === cleanCandidate.replace(/org$/, 'dotorg')
          ) {
            matchedToken = candidate
            matchedOffset = offset
            tokensToConsume = 1
            wordsToConsume = spokenLookAhead
            break
          }
        }

        if (matchedToken) break
      }

      // Check if multi-token candidate combination matches (e.g. cleanWord is "titaniumchitin" and candidates are "titanium-", "chitin")
      if (cleanWord.length > cleanCandidate.length && cleanWord.startsWith(cleanCandidate)) {
        let combinedCandidate = candidate
        let cleanCombined = cleanCandidate
        let candLookAhead = 1

        while (tokenIdx + offset + candLookAhead < originalTokens.length && cleanCombined.length < cleanWord.length) {
          const nextCand = originalTokens[tokenIdx + offset + candLookAhead]
          const cleanNext = nextCand.toLowerCase().replace(/[^a-z0-9]/g, '')
          combinedCandidate += nextCand
          cleanCombined += cleanNext
          candLookAhead++

          if (cleanCombined === cleanWord) {
            matchedToken = combinedCandidate
            matchedOffset = offset
            tokensToConsume = candLookAhead
            break
          }
        }

        if (matchedToken) break
      }

      // Prefix match fallback
      if (
        (cleanWord.length >= 3 && cleanCandidate.startsWith(cleanWord)) ||
        (cleanCandidate.length >= 3 && cleanWord.startsWith(cleanCandidate))
      ) {
        matchedToken = candidate
        matchedOffset = offset
        tokensToConsume = 1
        break
      }
    }

    if (matchedOffset >= 0) {
      tokenIdx = tokenIdx + matchedOffset + tokensToConsume
    } else if (tokenIdx < originalTokens.length) {
      matchedToken = originalTokens[tokenIdx++]
    }

    const effectiveToken = matchedToken || w.word
    const isSentenceEnd = /[.!?]+$/.test(effectiveToken) || /[.!?]+$/.test(w.word)
    const isClauseEnd = /[,;:\u2014-]+$/.test(effectiveToken) || /[,;:\u2014-]+$/.test(w.word)

    const endWord = wordsToConsume > 1 ? words[i + wordsToConsume - 1] : w
    const nextWord = words[i + wordsToConsume]
    const pauseToNextMs = nextWord ? nextWord.startMs - endWord.endMs : 0
    const hasLongPause = pauseToNextMs >= 240

    alignedWords.push({
      word: effectiveToken,
      startMs: w.startMs,
      endMs: endWord.endMs,
      durationMs: endWord.endMs - w.startMs,
      isSentenceEnd: isSentenceEnd || hasLongPause,
      isClauseEnd,
      pauseToNextMs,
    })

    if (wordsToConsume > 1) {
      i += wordsToConsume - 1
    }
  }

  return alignedWords
}

/**
 * Partition words of a single sentence into balanced phrase chunks of 2-3 words
 */
function partitionSentenceWords(sentenceWords: WordBoundaryEvent[], maxWordsPerChunk = 3): WordBoundaryEvent[][] {
  const n = sentenceWords.length
  if (n === 0) return []
  if (n <= maxWordsPerChunk) return [sentenceWords]

  if (n === 4) {
    return [sentenceWords.slice(0, 2), sentenceWords.slice(2, 4)]
  }

  if (n === 5) {
    if (sentenceWords[1]?.isClauseEnd) {
      return [sentenceWords.slice(0, 2), sentenceWords.slice(2, 5)]
    }
    return [sentenceWords.slice(0, 3), sentenceWords.slice(3, 5)]
  }

  if (n === 6) {
    return [sentenceWords.slice(0, 3), sentenceWords.slice(3, 6)]
  }

  const chunks: WordBoundaryEvent[][] = []
  let i = 0

  while (i < n) {
    const remaining = n - i
    if (remaining <= maxWordsPerChunk) {
      chunks.push(sentenceWords.slice(i, n))
      break
    }

    let take = 3
    if (remaining === 4) {
      take = 2
    } else if (remaining === 5) {
      take = sentenceWords[i + 1]?.isClauseEnd ? 2 : 3
    } else if (sentenceWords[i + 1]?.isClauseEnd && remaining > 3) {
      take = 2
    }

    chunks.push(sentenceWords.slice(i, i + take))
    i += take
  }

  return chunks
}

/**
 * Build Word Groups (Phrases of 2-3 words) strictly respecting sentence boundaries and speech cadence
 */
export function chunkWordsIntoPhrases(words: WordBoundaryEvent[], maxWordsPerChunk = 3): WordBoundaryEvent[][] {
  if (words.length === 0) return []

  const sentences: WordBoundaryEvent[][] = []
  let currentSentence: WordBoundaryEvent[] = []

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    currentSentence.push(word)

    const isEnd =
      word.isSentenceEnd === true ||
      /[.!?]$/.test(word.word.trim()) ||
      (words[i + 1] && words[i + 1].startMs - word.endMs >= 240)

    if (isEnd || i === words.length - 1) {
      if (currentSentence.length > 0) {
        sentences.push(currentSentence)
        currentSentence = []
      }
    }
  }

  const allChunks: WordBoundaryEvent[][] = []
  for (const sentence of sentences) {
    const sentenceChunks = partitionSentenceWords(sentence, maxWordsPerChunk)
    allChunks.push(...sentenceChunks)
  }

  return allChunks
}

/**
 * Generate ASS subtitle file with dynamic active word highlights
 */
export function generateAssSubtitles(words: WordBoundaryEvent[], outputPath: string): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,64,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,2,0,1,6,3,2,60,60,420,1
Style: Highlight,Arial,68,&H0000FFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,105,105,2,0,1,7,4,2,60,60,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  const phrases = chunkWordsIntoPhrases(words, 3)
  const lines: string[] = []

  for (const phrase of phrases) {
    if (phrase.length === 0) continue
    const phraseEnd = phrase[phrase.length - 1].endMs + 300

    for (let i = 0; i < phrase.length; i++) {
      const activeWord = phrase[i]
      const wordStart = activeWord.startMs
      const wordEnd = i === phrase.length - 1 ? phraseEnd : phrase[i + 1].startMs

      const styledWords = phrase.map((w, idx) => {
        const text = w.word.toUpperCase()
        if (idx === i) {
          return `{\\c&H00FFFF&\\fscx110\\fscy110}${text}{\\r}`
        }
        return `{\\c&H00FFFFFF&}${text}{\\r}`
      })

      let dialogue = ''
      for (let wIdx = 0; wIdx < styledWords.length; wIdx++) {
        dialogue += styledWords[wIdx]
        const origWord = phrase[wIdx].word
        if (
          wIdx < styledWords.length - 1 &&
          !origWord.endsWith('-') &&
          !origWord.endsWith('—') &&
          !origWord.endsWith('–') &&
          !origWord.endsWith('/')
        ) {
          dialogue += ' '
        }
      }
      lines.push(`Dialogue: 0,${formatAssTime(wordStart)},${formatAssTime(wordEnd)},Default,,0,0,0,,${dialogue}`)
    }
  }

  const content = header + lines.join('\n') + '\n'
  fs.writeFileSync(outputPath, content, 'utf8')
  return outputPath
}

/**
 * Generate standard SRT subtitle file
 */
export function generateSrtSubtitles(words: WordBoundaryEvent[], outputPath: string): string {
  const phrases = chunkWordsIntoPhrases(words, 4)
  const srtEntries: string[] = []

  phrases.forEach((phrase, index) => {
    if (phrase.length === 0) return
    const startMs = phrase[0].startMs
    const endMs = phrase[phrase.length - 1].endMs + 200
    const text = phrase.map((p) => p.word).join(' ').toUpperCase()

    srtEntries.push(`${index + 1}\n${formatSrtTime(startMs)} --> ${formatSrtTime(endMs)}\n${text}\n`)
  })

  const content = srtEntries.join('\n')
  fs.writeFileSync(outputPath, content, 'utf8')
  return outputPath
}

function resolveProviderMode(options: TTSGenerationOptions): TTSProviderName {
  if (options.provider) return options.provider
  const fromEnv = (process.env.TTS_PROVIDER || 'auto').toLowerCase()
  if (fromEnv === 'fish' || fromEnv === 'edge') return fromEnv
  return 'auto'
}

function toProviderOptions(options: TTSGenerationOptions, outputDir: string): ProviderGenerationOptions {
  return {
    voice: options.voice,
    rate: options.rate,
    pitch: options.pitch,
    outputDir,
    outputFilename: options.outputFilename,
    referenceId: options.referenceId,
    model: options.model,
  }
}

/**
 * Synthesize voiceover audio and generate word boundaries.
 * Primary: Fish Audio S2 (hosted). Fallback: Edge TTS.
 */
export async function generateVoiceover(text: string, options: TTSGenerationOptions = {}): Promise<TTSGenerationResult> {
  const outputDir = options.outputDir || path.resolve(process.cwd(), 'tmp')
  const timestamp = Date.now()
  const mode = resolveProviderMode(options)
  const providerOptions = toProviderOptions(options, outputDir)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  let providerResult: Awaited<ReturnType<typeof edgeProvider.synthesize>>
  let providerUsed: 'fish' | 'edge'

  if (mode === 'edge') {
    providerResult = await edgeProvider.synthesize(text, providerOptions)
    providerUsed = 'edge'
  } else if (mode === 'fish') {
    if (!isFishConfigured(providerOptions)) {
      throw new Error(
        'TTS_PROVIDER=fish requires FISH_API_KEY and FISH_VOICE_REFERENCE_ID (or referenceId option)'
      )
    }
    providerResult = await fishProvider.synthesize(text, providerOptions)
    providerUsed = 'fish'
  } else if (isFishConfigured(providerOptions)) {
    try {
      providerResult = await fishProvider.synthesize(text, providerOptions)
      providerUsed = 'fish'
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`⚠️ Fish Audio TTS failed, falling back to Edge TTS: ${message}`)
      providerResult = await edgeProvider.synthesize(text, providerOptions)
      providerUsed = 'edge'
    }
  } else {
    console.warn('⚠️ Fish Audio not configured (FISH_API_KEY missing); using Edge TTS')
    providerResult = await edgeProvider.synthesize(text, providerOptions)
    providerUsed = 'edge'
  }

  const assPath = path.join(outputDir, `subtitles-${timestamp}.ass`)
  const srtPath = path.join(outputDir, `subtitles-${timestamp}.srt`)

  generateAssSubtitles(providerResult.words, assPath)
  generateSrtSubtitles(providerResult.words, srtPath)

  return {
    audioPath: providerResult.audioPath,
    durationSeconds: providerResult.durationSeconds,
    words: providerResult.words,
    assSubtitlesPath: assPath,
    srtSubtitlesPath: srtPath,
    providerUsed,
  }
}
