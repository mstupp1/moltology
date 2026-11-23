/** Catalog rows as migration SQL, and which rows no migration has shipped yet. */
import fs from 'node:fs'
import path from 'node:path'
import { catalogSeedInsertValues, type EquipmentCatalogSeed } from '../../src/lib/equipment-seed-data'

const COLUMNS = ['id', 'slug', 'name', 'flavorText', 'category', 'rarity', 'visualType', 'primaryStat', 'affixes', 'uniquePower', 'imageUrl', 'sortOrder', 'kind', 'artKey', 'appearanceKey'] as const

const quote = (v: unknown) =>
  v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${(typeof v === 'string' ? v : JSON.stringify(v)).replace(/'/g, "''")}'`

/** An upsert of the given rows, keyed by id. */
export function catalogUpsertSql(rows: EquipmentCatalogSeed[]): string {
  const values = rows.map((row) => {
    const v = catalogSeedInsertValues(row) as Record<(typeof COLUMNS)[number], unknown>
    return `(${COLUMNS.map((k) => {
      const x = v[k]
      if (k === 'affixes') return `${quote(x)}::jsonb`
      if (k === 'uniquePower') return x ? `${quote(x)}::jsonb` : 'NULL'
      if (k === 'id') return `${quote(x)}::uuid`
      return quote(x)
    }).join(',')})`
  })
  return `INSERT INTO public.equipment_catalog (${COLUMNS.map((c) => `"${c}"`).join(',')}) VALUES
${values.join(',\n')}
ON CONFLICT (id) DO UPDATE SET ${COLUMNS.filter((c) => c !== 'id')
    .map((c) => `"${c}"=EXCLUDED."${c}"`)
    .join(',')};`
}

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
