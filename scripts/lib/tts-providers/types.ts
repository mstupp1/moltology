import type { WordBoundaryEvent } from '../tts-engine'

export type TTSProviderName = 'auto' | 'fish' | 'edge'

export interface ProviderGenerationOptions {
  voice?: string
  rate?: string
  pitch?: string
  outputDir: string
  outputFilename?: string
  referenceId?: string
  model?: string
}

export interface ProviderGenerationResult {
  audioPath: string
  durationSeconds: number
  words: WordBoundaryEvent[]
}

export interface TTSProvider {
  name: 'fish' | 'edge'
  synthesize(text: string, options: ProviderGenerationOptions): Promise<ProviderGenerationResult>
}
