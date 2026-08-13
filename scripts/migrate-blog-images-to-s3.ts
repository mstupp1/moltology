#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { uploadObject, DEFAULT_BUCKET } from '../src/lib/s3-client'
import { getMimeType, getPublicS3Url } from '../src/lib/ingest/s3-upload'

const PUBLIC_IMAGES_DIR = path.resolve(process.cwd(), 'public', 'images')
const S3_BASE_URL = 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets'

async function uploadPublicImages() {
  console.log(`=== 1. Uploading public/images to Neon S3 [${DEFAULT_BUCKET}] ===`)
  if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
    console.log(`No public/images directory found. Skipping image upload.`)
    return
  }

  const entries = fs.readdirSync(PUBLIC_IMAGES_DIR, { withFileTypes: true })
  let uploadedCount = 0

  for (const entry of entries) {
    if (entry.isFile() && !entry.name.startsWith('.')) {
      const filePath = path.join(PUBLIC_IMAGES_DIR, entry.name)
      const fileBuffer = fs.readFileSync(filePath)
      const contentType = getMimeType(filePath)
      const key = `images/${entry.name}`

      try {
        await uploadObject({
          key,
          body: fileBuffer,
          contentType,
          bucket: DEFAULT_BUCKET,
        })
        uploadedCount++
        console.log(`  ✓ Uploaded [${key}]`)
      } catch (err: any) {
        console.error(`  ❌ Failed [${key}]: ${err.message}`)
      }
    }
  }

  console.log(`✓ Uploaded ${uploadedCount} public image assets to Neon S3\n`)
}

async function updateDatabaseRows(dbUrl: string, label: string) {
  console.log(`=== 2. Standardizing blog_posts coverImageUrl in ${label} ===`)
  const sql = neon(dbUrl)

  // Fetch all blog posts
  const posts = await sql`SELECT id, slug, title, "coverImageUrl" FROM blog_posts;`
  console.log(`Found ${posts.length} blog posts in ${label}...`)

  let updatedCount = 0

  for (const post of posts) {
    const currentUrl = post.coverImageUrl || ''
    if (currentUrl.startsWith('/images/')) {
      const cleanPath = currentUrl.replace(/^\/+/, '')
      const s3Url = `${S3_BASE_URL}/${cleanPath}`

      await sql`
        UPDATE blog_posts
        SET "coverImageUrl" = ${s3Url}, "updatedAt" = NOW()
        WHERE id = ${post.id};
      `
      console.log(`  ✓ Standardized "${post.slug}":\n      FROM: ${currentUrl}\n      TO:   ${s3Url}`)
      updatedCount++
    }
  }

  console.log(`✓ Updated ${updatedCount} blog_posts in ${label}\n`)
}

async function run() {
  await uploadPublicImages()

  // Update Production DB
  const prodUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL
  if (prodUrl) {
    await updateDatabaseRows(prodUrl, 'PRODUCTION DATABASE')
  }

  // Update Dev DB if present
  const devUrl = process.env.DEV_DATABASE_URL
  if (devUrl && devUrl !== prodUrl) {
    await updateDatabaseRows(devUrl, 'DEV DATABASE')
  }

  console.log('=== Migration Complete ===')
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
