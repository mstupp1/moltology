#!/usr/bin/env node
/**
 * Backfills compressed `.webp` twins for bucket images (rules in src/lib/asset-formats.ts).
 *
 *   npm run s3:optimize -- --dry-run   list images missing a twin
 *   npm run s3:optimize                create the missing twins
 *   npm run s3:optimize -- --check     exit 1 if any twin is missing
 *
 * Originals are read through the site's CDN-cached /media route, not the bucket, so the
 * backfill costs as little Neon transfer as possible. Existing twins are never overwritten.
 */
import 'dotenv/config'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getS3Client, uploadObject, DEFAULT_BUCKET } from '../src/lib/s3-client'
import { hasWebpTwin, webpTwinKey } from '../src/lib/asset-formats'
import { toOptimizedWebp } from '../src/lib/ingest/optimize-image'

const MEDIA_ORIGIN = process.env.MEDIA_PROXY_ORIGIN || 'https://moltology.org'

async function listAllKeys(): Promise<Map<string, number>> {
  const client = getS3Client()
  const keys = new Map<string, number>()
  let token: string | undefined
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: DEFAULT_BUCKET, Prefix: 'images/', ContinuationToken: token })
    )
    for (const obj of page.Contents ?? []) {
      if (obj.Key) keys.set(obj.Key, obj.Size ?? 0)
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (token)
  return keys
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const checkOnly = process.argv.includes('--check')

  const keys = await listAllKeys()
  const missing = [...keys.keys()].filter((key) => hasWebpTwin(key) && !keys.has(webpTwinKey(key))).sort()

  console.log(`${keys.size} images in ${DEFAULT_BUCKET}; ${missing.length} need a .webp twin.`)
  if (checkOnly || dryRun) {
    for (const key of missing) console.log(`  missing  ${key} (${kb(keys.get(key) ?? 0)})`)
    if (checkOnly && missing.length > 0) process.exit(1)
    return
  }

  let before = 0
  let after = 0
  let failed = 0
  for (const key of missing) {
    try {
      const res = await fetch(`${MEDIA_ORIGIN}/media/${key}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const original = Buffer.from(await res.arrayBuffer())
      const twin = await toOptimizedWebp(original)
      await uploadObject({ key: webpTwinKey(key), body: twin, contentType: 'image/webp', bucket: DEFAULT_BUCKET })
      before += original.length
      after += twin.length
      console.log(`  ✓ ${webpTwinKey(key)}  ${kb(original.length)} → ${kb(twin.length)}`)
    } catch (err: any) {
      failed++
      console.error(`  ✗ ${key}: ${err.message}`)
    }
  }

  console.log(`\nDone: ${missing.length - failed} twins, ${kb(before)} → ${kb(after)}.`)
  if (failed > 0) {
    console.error(`${failed} failed.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
