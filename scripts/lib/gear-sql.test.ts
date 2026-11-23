import { describe, expect, it } from 'vitest'
import { ALL_EQUIPMENT_CATALOG } from '../../src/lib/equipment-seed-data'
import { migrationSql, shippedInMigration } from './gear-sql'

describe('gear catalog migrations', () => {
  // Fails when a piece is added without a migration (run `npm run gear:sql`), or when a shipped
  // piece's id or slug changes, which would hand members' copies to a different piece.
  it('ships every catalog row, with its id and slug, in a migration', () => {
    const sql = migrationSql()
    const missing = ALL_EQUIPMENT_CATALOG.filter((row) => !shippedInMigration(sql, row)).map((row) => row.slug)
    expect(missing).toEqual([])
  })
})
