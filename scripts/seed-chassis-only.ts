/**
 * Dev/local chassis catalog seed. Upserts equipment_catalog from seed data.
 * Does not grant user vault rows — that happens on first authenticated chassis load.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/seed-chassis-only.ts
 *
 * Apply schema first on the Neon `dev` branch (`npm run db:migrate`).
 * Do not run this against production `main` unless explicitly asked.
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../src/db/schema'
import {
  INITIAL_EQUIPMENT_CATALOG,
  catalogSeedInsertValues,
} from '../src/lib/equipment-seed-data'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const db = drizzle(neon(url), { schema })

  for (const item of INITIAL_EQUIPMENT_CATALOG) {
    const values = catalogSeedInsertValues(item)
    await db
      .insert(schema.equipmentCatalog)
      .values(values)
      .onConflictDoUpdate({
        target: schema.equipmentCatalog.id,
        set: {
          slug: values.slug,
          name: values.name,
          flavorText: values.flavorText,
          category: values.category,
          rarity: values.rarity,
          visualType: values.visualType,
          primaryStat: values.primaryStat,
          affixes: values.affixes,
          uniquePower: values.uniquePower,
          imageUrl: values.imageUrl,
          sortOrder: values.sortOrder,
        },
      })
  }

  console.log(`✓ Upserted ${INITIAL_EQUIPMENT_CATALOG.length} equipment catalog entries`)
  console.log('Chassis catalog seed complete. Signed-in members receive starter vault pieces on next Chassis load.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
