#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { uploadObject, getS3Client, DEFAULT_BUCKET } from '../src/lib/s3-client'
import { getMimeType, getPublicS3Url } from '../src/lib/ingest/s3-upload'
import { HeadObjectCommand } from '@aws-sdk/client-s3'

const PUBLIC_IMAGES_DIR = path.resolve(process.cwd(), 'public', 'images')

async function getAllFiles(dirPath: string, prefix = ''): Promise<{ fullPath: string; key: string }[]> {
  if (!fs.existsSync(dirPath)) return []
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  let files: { fullPath: string; key: string }[] = []

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dirPath, entry.name)
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      const sub = await getAllFiles(fullPath, relPath)
      files = files.concat(sub)
    } else if (entry.isFile()) {
      files.push({ fullPath, key: `images/${relPath}` })
    }
  }

  return files
}

async function verifyS3Object(key: string, bucket = DEFAULT_BUCKET): Promise<boolean> {
  const client = getS3Client()
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

async function syncAssets() {
  const isVerifyOnly = process.argv.includes('--verify')
  const isDryRun = process.argv.includes('--dry-run')

  console.log(`=== Moltology S3 Asset Sync & Verification ===`)
  console.log(`Target Bucket: ${DEFAULT_BUCKET}`)
  console.log(`Source Directory: ${PUBLIC_IMAGES_DIR}`)
  console.log(`Mode: ${isVerifyOnly ? 'VERIFY ONLY' : isDryRun ? 'DRY RUN' : 'SYNC & UPLOAD'}\n`)

  const files = await getAllFiles(PUBLIC_IMAGES_DIR)
  console.log(`Discovered ${files.length} image assets in public/images/...\n`)

  let uploadedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const file of files) {
    const stat = fs.statSync(file.fullPath)
    const sizeKB = (stat.size / 1024).toFixed(1)
    const contentType = getMimeType(file.fullPath)
    const publicUrl = getPublicS3Url(file.key, DEFAULT_BUCKET)

    if (isVerifyOnly) {
      const exists = await verifyS3Object(file.key)
      if (exists) {
        console.log(`  ✓ [VERIFIED] ${file.key} (${sizeKB} KB) -> ${publicUrl}`)
      } else {
        console.error(`  ❌ [MISSING]  ${file.key} not found on S3`)
        errorCount++
      }
      continue
    }

    if (isDryRun) {
      console.log(`  [DRY-RUN] Would upload: ${file.key} (${sizeKB} KB, ${contentType})`)
      continue
    }

    try {
      const fileBuffer = fs.readFileSync(file.fullPath)
      await uploadObject({
        key: file.key,
        body: fileBuffer,
        contentType,
        bucket: DEFAULT_BUCKET,
      })
      uploadedCount++
      console.log(`  ✓ [UPLOADED] ${file.key} (${sizeKB} KB) -> ${publicUrl}`)
    } catch (err: any) {
      errorCount++
      console.error(`  ❌ [FAILED]   ${file.key}: ${err.message}`)
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total Assets Checked: ${files.length}`)
  if (!isVerifyOnly && !isDryRun) {
    console.log(`Successfully Uploaded: ${uploadedCount}`)
  }
  if (errorCount > 0) {
    console.error(`Errors Encountered: ${errorCount}`)
    process.exit(1)
  } else {
    console.log(`Status: 100% S3 Asset Parity Verified ✓`)
  }
}

syncAssets().catch((err) => {
  console.error('Fatal Sync Error:', err)
  process.exit(1)
})
