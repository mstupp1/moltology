import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import { env } from '../env'

const sql = neon(env.DATABASE_URL)
export const db = drizzle(sql, { schema })

/**
 * Returns the shared Drizzle client over `DATABASE_URL` (`neondb_owner`).
 *
 * This backend enforces identity in application code (JWT verify + userId checks).
 * Do not pass Neon Auth JWTs into `neon(..., { authToken })` here: that option is
 * for Neon Authorize / Data API paths. Owner connections already bypass RLS, and
 * an opaque session cookie mistaken for a JWT breaks HTTP queries entirely.
 *
 * The optional `authToken` argument is accepted for call-site compatibility but ignored.
 */
export function getDb(_authToken?: string) {
  return db
}
