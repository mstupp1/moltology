import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import { env } from '../env'

const sql = neon(env.DATABASE_URL)
export const db = drizzle(sql, { schema })

/**
 * Returns a Drizzle ORM database client.
 * If an `authToken` (JWT) is provided, creates a Neon HTTP connection with that token
 * so Neon PostgreSQL can populate `current_setting('request.jwt.claims', true)` for RLS.
 */
export function getDb(authToken?: string) {
  if (!authToken) return db
  const customSql = neon(env.DATABASE_URL, { authToken })
  return drizzle(customSql, { schema })
}

