#!/usr/bin/env tsx
/**
 * Browse Fish Audio Voice Library presets and print reference IDs for FISH_VOICE_REFERENCE_ID.
 *
 * Usage:
 *   FISH_API_KEY=... npm run tts:voices
 *   FISH_API_KEY=... npm run tts:voices -- --search broadcaster
 */

import 'dotenv/config'
import { FishAudioClient } from 'fish-audio'

async function main(): Promise<void> {
  const apiKey = process.env.FISH_API_KEY || process.env.FISH_AUDIO_API_KEY
  if (!apiKey) {
    console.error('❌ Set FISH_API_KEY (or FISH_AUDIO_API_KEY) to list Fish Audio voices.')
    process.exit(1)
  }

  const searchArgIdx = process.argv.indexOf('--search')
  const searchQuery = searchArgIdx >= 0 ? process.argv[searchArgIdx + 1] : undefined

  const client = new FishAudioClient({ apiKey })
  const response = await client.voices.search(
    searchQuery ? { title: searchQuery } : undefined
  )

  const items = response.items || []
  if (items.length === 0) {
    console.log('No voices found.')
    return
  }

  console.log(`\n🎙️ Fish Audio Voice Library (${items.length} results)\n`)
  for (const voice of items) {
    const id = voice._id
    const title = voice.title || '(untitled)'
    const tags = voice.tags?.length ? voice.tags.join(', ') : '—'
    console.log(`  ${title}`)
    console.log(`    reference_id: ${id}`)
    console.log(`    tags: ${tags}`)
    console.log('')
  }

  console.log('Set FISH_VOICE_REFERENCE_ID in .env to the reference_id of your chosen voice.')
}

main().catch((err) => {
  console.error('Failed to list Fish Audio voices:', err)
  process.exit(1)
})
