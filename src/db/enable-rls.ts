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
    await sql`ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS user_stats ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS assets ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS daily_routines ENABLE ROW LEVEL SECURITY;`
    console.log('✓ RLS enabled on profiles, user_stats, assets, daily_routines')

    // 2. Drop existing policies if any to ensure clean idempotent script
    await sql`DROP POLICY IF EXISTS profiles_isolation_policy ON profiles;`
    await sql`DROP POLICY IF EXISTS users_isolation_policy ON users;`
    await sql`DROP POLICY IF EXISTS user_stats_isolation_policy ON user_stats;`
    await sql`DROP POLICY IF EXISTS assets_isolation_policy ON assets;`
    await sql`DROP POLICY IF EXISTS daily_routines_isolation_policy ON daily_routines;`

    // 3. Create RLS policies for user isolation against Neon Auth JWT 'sub' claim
    await sql`
      CREATE POLICY profiles_isolation_policy ON profiles
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

    // 4. Create trigger to auto-populate public.profiles on neon_auth.user creation
    try {
      await sql`
        CREATE OR REPLACE FUNCTION public.handle_new_neon_user()
        RETURNS trigger AS $$
        BEGIN
          INSERT INTO public.profiles (id)
          VALUES (NEW.id)
          ON CONFLICT (id) DO NOTHING;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `

      await sql`
        DROP TRIGGER IF EXISTS on_neon_auth_user_created ON neon_auth.user;
      `

      await sql`
        CREATE TRIGGER on_neon_auth_user_created
          AFTER INSERT ON neon_auth.user
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_neon_user();
      `
      console.log('✓ Automatic profile creation trigger configured on neon_auth.user')
    } catch (triggerErr) {
      console.warn('⚠️ Could not attach trigger to neon_auth.user (schema missing or restricted):', triggerErr)
    }

    // Ensure role column exists on profiles table
    await sql`ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';`

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
    await sql`DROP POLICY IF EXISTS changelogs_admin_insert_policy ON changelogs;`
    await sql`
      CREATE POLICY changelogs_admin_insert_policy ON changelogs
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
            AND profiles.role IN ('admin', 'super_admin')
        )
      );
    `
    console.log('✓ RLS and schema initialized for changelogs table')

    // Enable RLS for Forum Tables
    await sql`ALTER TABLE IF EXISTS forum_categories ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS forum_topics ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS forum_posts ENABLE ROW LEVEL SECURITY;`

    await sql`DROP POLICY IF EXISTS forum_categories_public_read_policy ON forum_categories;`
    await sql`CREATE POLICY forum_categories_public_read_policy ON forum_categories FOR SELECT USING (true);`

    await sql`DROP POLICY IF EXISTS forum_topics_public_read_policy ON forum_topics;`
    await sql`CREATE POLICY forum_topics_public_read_policy ON forum_topics FOR SELECT USING (true);`

    await sql`DROP POLICY IF EXISTS forum_topics_insert_policy ON forum_topics;`
    await sql`CREATE POLICY forum_topics_insert_policy ON forum_topics FOR INSERT WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`

    await sql`DROP POLICY IF EXISTS forum_posts_public_read_policy ON forum_posts;`
    await sql`CREATE POLICY forum_posts_public_read_policy ON forum_posts FOR SELECT USING (true);`

    await sql`DROP POLICY IF EXISTS forum_posts_insert_policy ON forum_posts;`
    await sql`CREATE POLICY forum_posts_insert_policy ON forum_posts FOR INSERT WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`

    console.log('✓ RLS policies configured for forum_categories, forum_topics, and forum_posts')

    console.log('✓ Row Level Security (RLS) policies successfully created!')

  } catch (error) {
    console.error('Error enabling RLS policies:', error)
    process.exit(1)
  }
}

applyRLS()
