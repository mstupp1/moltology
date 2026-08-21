#!/usr/bin/env node
/**
 * Character Creation & Ingestion CLI
 * Extracts chroma key backgrounds from generated mascot images and uploads cutouts to Neon S3.
 */

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../src/lib/s3-client'

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
Usage:
  npx tsx scripts/create-character.ts <input_image> <character_name> [options]

Arguments:
  input_image       Path to raw generated image (or existing transparent PNG)
  character_name    Base name of character (e.g. 'mantis_shrimp_punch' -> 'char_mantis_shrimp_punch.png')

Options:
  --color <color>   Chroma key color ('pink', 'green', 'auto', etc. Default: 'auto')
  --tolerance <num> Inner distance threshold (Default: 48)
  --smoothness <num> Smooth transition width (Default: 28)
  --no-upload       Skip S3 upload (only extract locally to scratch/characters/)

Example:
  npx tsx scripts/create-character.ts brain/char_raw.jpg mantis_punch --color auto
`)
    process.exit(0)
  }

  const inputPath = path.resolve(args[0])
  let charName = args[1]
  if (!charName) {
    charName = path.basename(inputPath, path.extname(inputPath))
  }
  if (!charName.startsWith('char_')) {
    charName = `char_${charName}`
  }

  let color = 'auto'
  let tolerance = '48'
  let smoothness = '28'
  let noUpload = false

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--color' && args[i + 1]) color = args[++i]
    else if (args[i] === '--tolerance' && args[i + 1]) tolerance = args[++i]
    else if (args[i] === '--smoothness' && args[i + 1]) smoothness = args[++i]
    else if (args[i] === '--no-upload') noUpload = true
  }

  const scratchDir = path.resolve(process.cwd(), 'scratch/characters')
  fs.mkdirSync(scratchDir, { recursive: true })
  const outputPng = path.join(scratchDir, `${charName}.png`)

  console.log(`◈ Processing Character: ${charName}`)
  console.log(`  • Input: ${inputPath}`)
  console.log(`  • Local Output: ${outputPng}`)

  // 1. Check if input is already transparent PNG or needs chroma keying
  if (inputPath.endsWith('.png') && !args.includes('--force-chroma')) {
    console.log(`  • Input is PNG, copying directly to ${outputPng}...`)
    fs.copyFileSync(inputPath, outputPng)
  } else {
    console.log(`  • Running high-precision chroma key extraction (${color})...`)
    const chromaScript = path.resolve(process.cwd(), 'scripts/chroma_key.py')
    const cmd = `python3 "${chromaScript}" "${inputPath}" "${outputPng}" --color ${color} --tolerance ${tolerance} --smoothness ${smoothness} --despill-strength 0.85 --trim --margin 24`
    execSync(cmd, { stdio: 'inherit' })
  }

  if (noUpload) {
    console.log(`✓ Local extraction complete! Skipped S3 upload (--no-upload).`)
    return
  }

  // 2. Upload to Neon S3
  const s3Key = `images/characters/${charName}.png`
  console.log(`  • Uploading to Neon S3 [${DEFAULT_BUCKET}]: ${s3Key}...`)
  const result = await uploadLocalFileToS3(outputPng, s3Key, DEFAULT_BUCKET)

  console.log(`\n✓ Character Ingestion Complete!`)
  console.log(`  • Key: ${result.key}`)
  console.log(`  • Public CDN URL: ${result.publicUrl}`)
  console.log(`  • Size: ${(result.size / 1024).toFixed(1)} KB`)
}

if (process.argv[1]?.includes('create-character.ts')) {
  main().catch((err) => {
    console.error(`❌ Error:`, err)
    process.exit(1)
  })
}
