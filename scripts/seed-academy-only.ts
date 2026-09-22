/**
 * One-shot Molt Academy catalog seed for an environment whose academy tables are empty.
 * Existing slugs are left in place.
 * Usage: DATABASE_URL=... npx tsx scripts/seed-academy-only.ts
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../src/db/schema'
import { seedAcademyCatalog } from '../src/db/seed-academy'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }
  const db = drizzle(neon(url), { schema })
  const result = await seedAcademyCatalog(db)
  console.log(`✓ academy courses: ${result.courses}`)
  console.log(`✓ academy tracks: ${result.tracks}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
