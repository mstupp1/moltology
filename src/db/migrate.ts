import 'dotenv/config'
import { migrate } from 'drizzle-orm/neon-http/migrator'
import { db } from './index'

async function main() {
  try {
    console.log('[MIGRATE] Running database migrations on Neon PostgreSQL...')
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('[MIGRATE] ✓ All migrations applied successfully!')
  } catch (err) {
    console.error('[MIGRATE] Error applying migrations:', err)
    process.exit(1)
  }
}

main()
