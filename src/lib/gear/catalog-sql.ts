/** Catalog rows as an SQL upsert into equipment_catalog, the database's mirror of the code catalog. */
import { catalogSeedInsertValues, type EquipmentCatalogSeed } from '../equipment-seed-data'

const COLUMNS = ['id', 'slug', 'name', 'flavorText', 'category', 'rarity', 'visualType', 'primaryStat', 'affixes', 'uniquePower', 'imageUrl', 'sortOrder', 'kind', 'artKey', 'appearanceKey'] as const

const quote = (v: unknown) =>
  v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${(typeof v === 'string' ? v : JSON.stringify(v)).replace(/'/g, "''")}'`

/**
 * An upsert of the given rows, keyed by id. With `onlyChanged`, rows already matching are left
 * alone (no write, no row lock), so running it when nothing changed costs one read.
 */
export function catalogUpsertSql(rows: EquipmentCatalogSeed[], { onlyChanged = false } = {}): string {
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
  const cols = COLUMNS.filter((c) => c !== 'id')
  const where = onlyChanged
    ? `\nWHERE (${cols.map((c) => `equipment_catalog."${c}"`).join(',')}) IS DISTINCT FROM (${cols.map((c) => `EXCLUDED."${c}"`).join(',')})`
    : ''
  return `INSERT INTO public.equipment_catalog (${COLUMNS.map((c) => `"${c}"`).join(',')}) VALUES
${values.join(',\n')}
ON CONFLICT (id) DO UPDATE SET ${cols.map((c) => `"${c}"=EXCLUDED."${c}"`).join(',')}${where};`
}
