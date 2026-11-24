import { describe, expect, it } from 'vitest'
import { ALL_EQUIPMENT_CATALOG } from '../../src/lib/equipment-seed-data'
import { catalogUpsertSql } from '../../src/lib/gear/catalog-sql'
import { migrationSql, shippedInMigration } from './gear-sql'

describe('gear catalog', () => {
  // New pieces need no migration (the server syncs the catalog table from code). But a piece an
  // old migration shipped must keep its id and slug, or members' copies would point at another piece.
  it('keeps the id and slug of every piece an old migration shipped', () => {
    const sql = migrationSql()
    const moved = ALL_EQUIPMENT_CATALOG.filter((row) => sql.includes(`('${row.id}'`) && !shippedInMigration(sql, row)).map((row) => row.slug)
    expect(moved).toEqual([])
  })

  // Slugs are unique in the table, so a new piece reusing an old row's slug would fail the sync.
  it('never reuses a slug an old migration gave another id', () => {
    const shipped = new Map<string, string>()
    for (const m of migrationSql().matchAll(/\('([0-9a-f-]{36})'(?:::uuid)?,'([^']+)'/g)) shipped.set(m[2], m[1])
    const clashes = ALL_EQUIPMENT_CATALOG.filter((row) => shipped.has(row.slug) && shipped.get(row.slug) !== row.id).map((row) => row.slug)
    expect(clashes).toEqual([])
  })

  it('only rewrites rows that changed when syncing', () => {
    const upsert = catalogUpsertSql(ALL_EQUIPMENT_CATALOG.slice(0, 2), { onlyChanged: true })
    expect(upsert).toMatch(/ON CONFLICT \(id\) DO UPDATE SET .*\nWHERE \(equipment_catalog\."slug".*IS DISTINCT FROM \(EXCLUDED\."slug"/s)
    expect(catalogUpsertSql(ALL_EQUIPMENT_CATALOG.slice(0, 2))).not.toMatch(/IS DISTINCT FROM/)
  })
})
