#!/usr/bin/env node
import 'dotenv/config'
import { uploadLocalFileToS3 } from '../src/lib/ingest/s3-upload'
import { DEFAULT_BUCKET } from '../src/lib/s3-client'

async function runCli() {
  const args = process.argv.slice(2)
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
Usage:
  npx tsx scripts/upload-asset.ts <filePath> [options]

Options:
  --key <s3Key>     Custom S3 key/path (e.g. images/blog/my-image.png)
  --bucket <name>   Target S3 bucket (default: ${DEFAULT_BUCKET})

Examples:
  npx tsx scripts/upload-asset.ts path/to/image.png
  npx tsx scripts/upload-asset.ts path/to/cover.jpg --key images/news/dispatch-cover.jpg
`)
    process.exit(0)
  }

  const filePath = args[0]
  let key: string | undefined
  let bucket = DEFAULT_BUCKET

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--key' && args[i + 1]) {
      key = args[++i]
    } else if (args[i] === '--bucket' && args[i + 1]) {
      bucket = args[++i]
    }
  }

  try {
    console.log(`Uploading "${filePath}" to Neon S3 [${bucket}]...`)
    const result = await uploadLocalFileToS3(filePath, key, bucket)
    console.log(`✓ Upload successful!`)
    console.log(`  • Key: ${result.key}`)
    console.log(`  • Size: ${result.size} bytes`)
    console.log(`  • Public URL: ${result.publicUrl}`)
  } catch (err: any) {
    console.error(`❌ Upload failed: ${err.message}`)
    process.exit(1)
  }
}

if (process.argv[1]?.includes('upload-asset.ts')) {
  runCli()
}
