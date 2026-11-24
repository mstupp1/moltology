/**
 * The gear catalog lives in code (src/lib/gear/pieces.ts). The equipment_catalog table is only a
 * mirror, kept because owned pieces reference it and the character save functions read it.
 *
 * Server code reads pieces from code, and calls `ensureGearCatalog` before writing a row that
 * points at a piece. The first call on each server instance upserts every piece that is missing
 * or changed, so a merged PR's new pieces reach the database without a migration. Rows are never
 * deleted: a piece leaves the shop with `retired`, and its owners keep it.
 */
import { sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import { ALL_EQUIPMENT_CATALOG } from '../equipment-seed-data'
import { catalogUpsertSql } from '../gear/catalog-sql'

type Db = ReturnType<typeof getDb>

let synced: Promise<void> | null = null

/** Upserts the code catalog into the table once per server instance (retried after a failure). */
export function ensureGearCatalog(db: Db): Promise<void> {
  synced ??= syncGearCatalog(db).then(
    () => undefined,
    (error) => {
      synced = null
      throw error
    },
  )
  return synced
}

/** Writes every missing or changed catalog row. Returns how many rows it wrote. */
export async function syncGearCatalog(db: Db): Promise<number> {
  const res = await db.execute(sql.raw(catalogUpsertSql(ALL_EQUIPMENT_CATALOG, { onlyChanged: true })))
  return Number((res as { rowCount?: number }).rowCount ?? 0)
}

/** Tests only: forget that this instance synced. */
export function resetGearCatalogSync() {
  synced = null
}
