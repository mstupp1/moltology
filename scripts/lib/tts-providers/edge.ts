import fs from 'node:fs'
import path from 'node:path'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import { alignWordsWithOriginalText, type WordBoundaryEvent } from '../tts-engine'
import type { ProviderGenerationOptions, ProviderGenerationResult, TTSProvider } from './types'

export async function synthesizeWithEdge(
  text: string,
  options: ProviderGenerationOptions
): Promise<ProviderGenerationResult> {
  const voice = options.voice || 'en-US-ChristopherNeural'
  const rate = options.rate || '+8%'
  const pitch = options.pitch || '+0Hz'
  const timestamp = Date.now()

  const tts = new MsEdgeTTS()
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true,
  })

  const sessionDir = path.join(options.outputDir, `tts-edge-${timestamp}`)
  fs.mkdirSync(sessionDir, { recursive: true })

  const result = await tts.toFile(sessionDir, text, { rate, pitch })
  const rawAudioPath = result.audioFilePath
  const metadataPath = result.metadataFilePath

  let words: WordBoundaryEvent[] = []
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
            words.push({ word: wordText, startMs, endMs, durationMs })
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to parse Edge TTS metadata for word boundaries:', err)
    }
  }

  words = alignWordsWithOriginalText(words, text)

  let durationSeconds = 0
  if (words.length > 0) {
    durationSeconds = (words[words.length - 1].endMs + 300) / 1000
  }

  const finalAudioPath = options.outputFilename
    ? path.join(options.outputDir, options.outputFilename)
    : path.join(options.outputDir, `voiceover-edge-${timestamp}.mp3`)

  fs.copyFileSync(rawAudioPath, finalAudioPath)

  return { audioPath: finalAudioPath, durationSeconds, words }
}

export const edgeProvider: TTSProvider = {
  name: 'edge',
  synthesize: synthesizeWithEdge,
}
