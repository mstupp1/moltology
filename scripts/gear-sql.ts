/**
 * Prints the catalog upsert for gear pieces no migration has shipped yet (or every row with
 * --all). Paste it into a new custom migration:
 *
 *   npx drizzle-kit generate --custom --name <what changed>
 *   npm run gear:sql >> drizzle/<that file>.sql
 *
 * Also rerun it (with --all) after changing names, flavour text or prices of shipped pieces.
 */
import { ALL_EQUIPMENT_CATALOG } from '../src/lib/equipment-seed-data'
import { catalogUpsertSql, migrationSql, shippedInMigration } from './lib/gear-sql'

const all = process.argv.includes('--all')
const sql = migrationSql()
const rows = all ? ALL_EQUIPMENT_CATALOG : ALL_EQUIPMENT_CATALOG.filter((row) => !shippedInMigration(sql, row))
if (!rows.length) {
  console.error('Every catalog row is already in a migration.')
  process.exit(0)
}
console.log(catalogUpsertSql(rows))
console.error(`${rows.length} rows`)
