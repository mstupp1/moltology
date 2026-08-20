import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { INITIAL_CHANGELOGS } from '../lib/changelogs-data'

dotenv.config()

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.log('DATABASE_URL not found in env, skipping remote DB seed.')
  process.exit(0)
}

const sql = neon(databaseUrl)

async function seed() {
  console.log('Seeding changelog entries into PostgreSQL...')
  try {
    // Create table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS changelogs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT UNIQUE NOT NULL,
        version TEXT NOT NULL DEFAULT 'v1.0.0',
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        "isPublished" BOOLEAN NOT NULL DEFAULT true,
        "releasedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `

    for (const item of INITIAL_CHANGELOGS) {
      // Check if slug or version exists
      const existing = await sql`SELECT id FROM changelogs WHERE slug = ${item.slug} OR version = ${item.version};`
      if (existing.length === 0) {
        await sql`
          INSERT INTO changelogs (slug, version, title, category, summary, content, "isPublished", "releasedAt")
          VALUES (${item.slug}, ${item.version}, ${item.title}, ${item.category}, ${item.summary}, ${item.content}, true, ${item.releasedAt});
        `
        console.log(`✓ Inserted changelog ${item.slug} (${item.version})`)
      } else {
        console.log(`- Changelog ${item.slug} already exists`)
      }
    }
    console.log('✓ Changelog seeding complete!')
  } catch (err) {
    console.error('Error seeding changelogs:', err)
  }
}

if (process.argv[1]?.includes('seed-changelogs')) {
  seed()
}
