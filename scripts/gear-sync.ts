/**
 * Upserts the code gear catalog (src/lib/gear/pieces.ts) into equipment_catalog on the database
 * in DATABASE_URL. Servers do this on their own (src/lib/server/gear-catalog.ts); run this to
 * sync a local or dev database without starting the app.
 */
import 'dotenv/config'
import { getDb } from '../src/db'
import { syncGearCatalog } from '../src/lib/server/gear-catalog'

const written = await syncGearCatalog(getDb())
console.log(`${written} catalog rows written (missing or changed).`)
