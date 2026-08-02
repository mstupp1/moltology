import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config()

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set in environment.')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function applyRLS() {
  console.log('Enabling Row Level Security (RLS) on Neon PostgreSQL database tables...')

  try {
    // 1. Enable RLS on user-scoped tables
    await sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE assets ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE daily_routines ENABLE ROW LEVEL SECURITY;`
    console.log('✓ RLS enabled on users, user_stats, assets, daily_routines')

    // 2. Drop existing policies if any to ensure clean idempotent script
    await sql`DROP POLICY IF EXISTS users_isolation_policy ON users;`
    await sql`DROP POLICY IF EXISTS user_stats_isolation_policy ON user_stats;`
    await sql`DROP POLICY IF EXISTS assets_isolation_policy ON assets;`
    await sql`DROP POLICY IF EXISTS daily_routines_isolation_policy ON daily_routines;`

    // 3. Create RLS policies for user isolation against Neon Auth JWT 'sub' claim
    await sql`
      CREATE POLICY users_isolation_policy ON users
      FOR ALL
      USING (
        id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY user_stats_isolation_policy ON user_stats
      FOR ALL
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY assets_isolation_policy ON assets
      FOR ALL
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY daily_routines_isolation_policy ON daily_routines
      FOR ALL
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    // Enable RLS and DDL for changelogs table
    await sql`
      CREATE TABLE IF NOT EXISTS changelogs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        "isPublished" BOOLEAN NOT NULL DEFAULT true,
        "releasedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `
    await sql`ALTER TABLE changelogs ENABLE ROW LEVEL SECURITY;`
    await sql`DROP POLICY IF EXISTS changelogs_public_read_policy ON changelogs;`
    await sql`
      CREATE POLICY changelogs_public_read_policy ON changelogs
      FOR SELECT
      USING (true);
    `
    console.log('✓ RLS and schema initialized for changelogs table')

    console.log('✓ Row Level Security (RLS) policies successfully created!')
  } catch (error) {

    console.error('Error enabling RLS policies:', error)
    process.exit(1)
  }
}

applyRLS()
