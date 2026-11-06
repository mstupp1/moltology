import { sql, type SQL } from 'drizzle-orm'
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core'

/**
 * Row-cursor condition for a list ordered by (`timeColumn` DESC, `idColumn` DESC):
 * keeps rows strictly older than the row whose id is `cursorId`.
 *
 * The comparison reads the cursor row's own timestamp inside SQL, so it is exact
 * to the microsecond. An unknown cursor id yields no rows rather than page one.
 */
export function olderThanRow(
  table: PgTable,
  timeColumn: AnyPgColumn,
  idColumn: AnyPgColumn,
  cursorId: string,
): SQL {
  return sql`(${timeColumn}, ${idColumn}) < (SELECT c.${sql.identifier(timeColumn.name)}, c.${sql.identifier(idColumn.name)} FROM ${table} c WHERE c.${sql.identifier(idColumn.name)} = ${cursorId})`
}
