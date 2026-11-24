/** Catalog rows as migration SQL, and which rows no migration has shipped yet. */
import fs from 'node:fs'
import path from 'node:path'
import type { EquipmentCatalogSeed } from '../../src/lib/equipment-seed-data'

export { catalogUpsertSql } from '../../src/lib/gear/catalog-sql'

/** Every migration's SQL, joined. */
export function migrationSql(dir = path.resolve(process.cwd(), 'drizzle')): string {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'))
    .join('\n')
}

/** Whether some migration inserts this row with this id AND this slug (so ids never drift between pieces). */
export function shippedInMigration(sql: string, row: Pick<EquipmentCatalogSeed, 'id' | 'slug'>): boolean {
  return sql.includes(`('${row.id}'::uuid,'${row.slug}'`) || sql.includes(`('${row.id}','${row.slug}'`)
}
