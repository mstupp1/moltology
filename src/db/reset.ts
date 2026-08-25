import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config()

export async function resetDatabase(databaseUrl?: string) {
  const url = databaseUrl !== undefined ? databaseUrl : process.env.DATABASE_URL
  if (!url) {
    console.log('[RESET] DATABASE_URL missing in environment. Skipping database reset.')
    return { success: false, reason: 'DATABASE_URL missing' }
  }

  console.log('[RESET] ⚠️ Wiping and resetting database tables...')
  const sql = neon(url)

  try {
    // Truncate tables cleanly with CASCADE
    await sql`
      TRUNCATE TABLE 
        routine_completions,
        routines, 
        user_stats, 
        profiles, 
        changelogs,
        gallery_pins,
        ai_messages,
        ai_threads
      RESTART IDENTITY CASCADE;
    `
    console.log('[RESET] ✓ All database tables truncated successfully!')
    return { success: true }
  } catch (error) {
    console.warn('[RESET] Truncate encountered missing tables (first run?), falling back to individual table drops/truncates:', error)
    try {
      await sql`DROP TABLE IF EXISTS ai_messages CASCADE;`
      await sql`DROP TABLE IF EXISTS ai_threads CASCADE;`
      await sql`DROP TABLE IF EXISTS gallery_pins CASCADE;`
      await sql`DROP TABLE IF EXISTS routine_completions CASCADE;`
      await sql`DROP TABLE IF EXISTS routines CASCADE;`
      await sql`DROP TABLE IF EXISTS user_stats CASCADE;`
      await sql`DROP TABLE IF EXISTS sessions CASCADE;`
      await sql`DROP TABLE IF EXISTS accounts CASCADE;`
      await sql`DROP TABLE IF EXISTS users CASCADE;`
      await sql`DROP TABLE IF EXISTS profiles CASCADE;`
      await sql`DROP TABLE IF EXISTS changelogs CASCADE;`
      console.log('[RESET] ✓ Dropped all existing tables for clean schema re-push.')
      return { success: true }
    } catch (fallbackError) {
      console.error('[RESET] Error during fallback table drop:', fallbackError)
      throw fallbackError
    }
  }
}

if (process.argv[1]?.includes('reset.ts')) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
