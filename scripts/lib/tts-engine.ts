import fs from 'node:fs'
import path from 'node:path'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

export interface WordBoundaryEvent {
  word: string
  startMs: number
  endMs: number
  durationMs: number
}

export interface TTSGenerationOptions {
  voice?: string
  rate?: string // e.g. "+5%", "+10%", "-5%"
  pitch?: string // e.g. "+0Hz", "-5Hz"
  outputDir?: string
  outputFilename?: string
}

export interface TTSGenerationResult {
  audioPath: string
  durationSeconds: number
  words: WordBoundaryEvent[]
  assSubtitlesPath?: string
  srtSubtitlesPath?: string
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
 * Build Word Groups (Phrases of 3-5 words) for kinetic captioning
 */
export function chunkWordsIntoPhrases(words: WordBoundaryEvent[], maxWordsPerChunk = 4): WordBoundaryEvent[][] {
  const chunks: WordBoundaryEvent[][] = []
  let currentChunk: WordBoundaryEvent[] = []

  for (const word of words) {
    currentChunk.push(word)
    // Break chunk if punctutation or length reached
    const hasPunctuation = /[.!?]$/.test(word.word.trim())
    if (currentChunk.length >= maxWordsPerChunk || hasPunctuation) {
      chunks.push(currentChunk)
      currentChunk = []
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}

/**
 * Generate ASS subtitle file with dynamic active word highlights
 * Note: ASS colors are hex &HAABBGGRR (e.g., Cyan #00ffff is &H00FFFF00&, Amber #f59e0b is &H000B9EF5&)
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

  const phrases = chunkWordsIntoPhrases(words, 4)
  const lines: string[] = []

  for (const phrase of phrases) {
    if (phrase.length === 0) continue
    const phraseStart = phrase[0].startMs
    const phraseEnd = phrase[phrase.length - 1].endMs + 300 // Slight hold

    for (let i = 0; i < phrase.length; i++) {
      const activeWord = phrase[i]
      const wordStart = activeWord.startMs
      const wordEnd = i === phrase.length - 1 ? phraseEnd : phrase[i + 1].startMs

      const styledWords = phrase.map((w, idx) => {
        const text = w.word.toUpperCase()
        if (idx === i) {
          // Highlight active word in glowing cyan with scale
          return `{\\c&H00FFFF&\\fscx110\\fscy110}${text}{\\r}`
        }
        return `{\\c&H00FFFFFF&}${text}{\\r}`
      })

      const dialogue = styledWords.join(' ')
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

/**
 * Synthesize voiceover audio and generate word boundaries
 */
export async function generateVoiceover(text: string, options: TTSGenerationOptions = {}): Promise<TTSGenerationResult> {
  const voice = options.voice || 'en-US-ChristopherNeural' // Default crisp broadcaster voice
  const rate = options.rate || '+8%' // Slightly accelerated for social retention
  const pitch = options.pitch || '+0Hz'
  const outputDir = options.outputDir || path.resolve(process.cwd(), 'tmp')
  const timestamp = Date.now()

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const tts = new MsEdgeTTS()
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true,
  })

  // Format SSML or prosody
  const prosodyOptions = {
    rate,
    pitch,
  }

  const sessionDir = path.join(outputDir, `tts-${timestamp}`)
  fs.mkdirSync(sessionDir, { recursive: true })

  const result = await tts.toFile(sessionDir, text, prosodyOptions)
  const rawAudioPath = result.audioFilePath
  const metadataPath = result.metadataFilePath

  // Parse word boundaries
  const words: WordBoundaryEvent[] = []
  if (metadataPath && fs.existsSync(metadataPath)) {
    try {
      const metaJson = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
      const metadataList = metaJson.Metadata || []

      for (const item of metadataList) {
        if (item.Type === 'WordBoundary' && item.Data) {
          const offset100ns = item.Data.Offset || 0
          const duration100ns = item.Data.Duration || 0
          const wordText = item.Data.text?.Text || ''

          const startMs = Math.round(offset100ns / 10000)
          const durationMs = Math.round(duration100ns / 10000)
          const endMs = startMs + durationMs

          if (wordText.trim()) {
            words.push({
              word: wordText,
              startMs,
              endMs,
              durationMs,
            })
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to parse metadata file for word boundaries:', err)
    }
  }

  // Calculate approximate audio duration
  let durationSeconds = 0
  if (words.length > 0) {
    durationSeconds = (words[words.length - 1].endMs + 300) / 1000
  }

  // Rename audio to unique target if requested
  const finalAudioPath = options.outputFilename
    ? path.join(outputDir, options.outputFilename)
    : path.join(outputDir, `voiceover-${timestamp}.mp3`)

  fs.copyFileSync(rawAudioPath, finalAudioPath)

  // Generate ASS and SRT subtitle files
  const assPath = path.join(outputDir, `subtitles-${timestamp}.ass`)
  const srtPath = path.join(outputDir, `subtitles-${timestamp}.srt`)

  generateAssSubtitles(words, assPath)
  generateSrtSubtitles(words, srtPath)

  return {
    audioPath: finalAudioPath,
    durationSeconds,
    words,
    assSubtitlesPath: assPath,
    srtSubtitlesPath: srtPath,
  }
}
