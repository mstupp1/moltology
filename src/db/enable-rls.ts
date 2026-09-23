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
    await sql`ALTER TABLE IF EXISTS routines ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS routine_completions ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS activity_events ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS user_avatars ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS equipment_catalog ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS user_gear_items ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS friend_requests ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS friendships ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS suggestion_dismissals ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS member_bonds ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS xp_transactions ENABLE ROW LEVEL SECURITY;`
    console.log('✓ RLS enabled on profiles, user_stats, routines, routine_completions, activity_events, user_avatars, equipment_catalog, user_gear_items, friend_requests, friendships, suggestion_dismissals, member_bonds, notifications, xp_transactions')

    // 2. Drop existing policies if any to ensure clean idempotent script
    await sql`DROP POLICY IF EXISTS profiles_isolation_policy ON profiles;`
    await sql`DROP POLICY IF EXISTS users_isolation_policy ON users;`
    await sql`DROP POLICY IF EXISTS user_stats_isolation_policy ON user_stats;`
    await sql`DROP POLICY IF EXISTS routines_isolation_policy ON routines;`
    await sql`DROP POLICY IF EXISTS routine_completions_isolation_policy ON routine_completions;`
    await sql`DROP POLICY IF EXISTS activity_events_isolation_policy ON activity_events;`
    await sql`DROP POLICY IF EXISTS activity_events_select_policy ON activity_events;`
    await sql`DROP POLICY IF EXISTS activity_events_owner_insert_policy ON activity_events;`
    await sql`DROP POLICY IF EXISTS activity_events_owner_update_policy ON activity_events;`
    await sql`DROP POLICY IF EXISTS activity_events_owner_delete_policy ON activity_events;`
    await sql`DROP POLICY IF EXISTS xp_transactions_isolation_policy ON xp_transactions;`
    await sql`DROP POLICY IF EXISTS user_avatars_isolation_policy ON user_avatars;`
    await sql`DROP POLICY IF EXISTS equipment_catalog_public_read_policy ON equipment_catalog;`
    await sql`DROP POLICY IF EXISTS user_gear_items_isolation_policy ON user_gear_items;`
    await sql`DROP POLICY IF EXISTS friend_requests_party_select_policy ON friend_requests;`
    await sql`DROP POLICY IF EXISTS friend_requests_sender_insert_policy ON friend_requests;`
    await sql`DROP POLICY IF EXISTS friend_requests_party_update_policy ON friend_requests;`
    await sql`DROP POLICY IF EXISTS friendships_party_select_policy ON friendships;`
    await sql`DROP POLICY IF EXISTS friendships_party_insert_policy ON friendships;`
    await sql`DROP POLICY IF EXISTS friendships_party_delete_policy ON friendships;`
    await sql`DROP POLICY IF EXISTS suggestion_dismissals_owner_select_policy ON suggestion_dismissals;`
    await sql`DROP POLICY IF EXISTS suggestion_dismissals_owner_insert_policy ON suggestion_dismissals;`
    await sql`DROP POLICY IF EXISTS suggestion_dismissals_owner_delete_policy ON suggestion_dismissals;`
    await sql`DROP POLICY IF EXISTS member_bonds_party_select_policy ON member_bonds;`
    await sql`DROP POLICY IF EXISTS member_bonds_party_insert_policy ON member_bonds;`
    await sql`DROP POLICY IF EXISTS member_bonds_party_delete_policy ON member_bonds;`
    await sql`DROP POLICY IF EXISTS notifications_owner_select_policy ON notifications;`
    await sql`DROP POLICY IF EXISTS notifications_owner_update_policy ON notifications;`
    await sql`DROP POLICY IF EXISTS notifications_insert_policy ON notifications;`

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
      CREATE POLICY routines_isolation_policy ON routines
      FOR ALL
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY routine_completions_isolation_policy ON routine_completions
      FOR ALL
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY activity_events_select_policy ON activity_events
      FOR SELECT
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
        OR visibility = 'public'
        OR (
          visibility = 'friends'
          AND EXISTS (
            SELECT 1 FROM friendships f
            WHERE (
              (f."userAId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') AND f."userBId" = activity_events."userId")
              OR (f."userBId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') AND f."userAId" = activity_events."userId")
            )
          )
        )
      );
    `
    await sql`
      CREATE POLICY activity_events_owner_insert_policy ON activity_events
      FOR INSERT
      WITH CHECK (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `
    await sql`
      CREATE POLICY activity_events_owner_update_policy ON activity_events
      FOR UPDATE
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      )
      WITH CHECK (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `
    await sql`
      CREATE POLICY activity_events_owner_delete_policy ON activity_events
      FOR DELETE
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY xp_transactions_isolation_policy ON xp_transactions
      FOR ALL
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY user_avatars_isolation_policy ON user_avatars
      FOR ALL
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY equipment_catalog_public_read_policy ON equipment_catalog
      FOR SELECT
      USING (true);
    `

    await sql`
      CREATE POLICY user_gear_items_isolation_policy ON user_gear_items
      FOR ALL
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY friend_requests_party_select_policy ON friend_requests
      FOR SELECT
      USING (
        "senderId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR "recipientId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `
    await sql`
      CREATE POLICY friend_requests_sender_insert_policy ON friend_requests
      FOR INSERT
      WITH CHECK (
        "senderId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `
    await sql`
      CREATE POLICY friend_requests_party_update_policy ON friend_requests
      FOR UPDATE
      USING (
        "senderId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR "recipientId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      )
      WITH CHECK (
        "senderId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR "recipientId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY friendships_party_select_policy ON friendships
      FOR SELECT
      USING (
        "userAId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR "userBId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `
    await sql`
      CREATE POLICY friendships_party_insert_policy ON friendships
      FOR INSERT
      WITH CHECK (
        "userAId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR "userBId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `
    await sql`
      CREATE POLICY friendships_party_delete_policy ON friendships
      FOR DELETE
      USING (
        "userAId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR "userBId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY suggestion_dismissals_owner_select_policy ON suggestion_dismissals
      FOR SELECT
      USING (
        "viewerId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `
    await sql`
      CREATE POLICY suggestion_dismissals_owner_insert_policy ON suggestion_dismissals
      FOR INSERT
      WITH CHECK (
        "viewerId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `
    await sql`
      CREATE POLICY suggestion_dismissals_owner_delete_policy ON suggestion_dismissals
      FOR DELETE
      USING (
        "viewerId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY member_bonds_party_select_policy ON member_bonds
      FOR SELECT
      USING (
        "fromUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR "toUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `
    await sql`
      CREATE POLICY member_bonds_party_insert_policy ON member_bonds
      FOR INSERT
      WITH CHECK (
        "fromUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR "toUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `
    await sql`
      CREATE POLICY member_bonds_party_delete_policy ON member_bonds
      FOR DELETE
      USING (
        "fromUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR "toUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `

    await sql`
      CREATE POLICY notifications_owner_select_policy ON notifications
      FOR SELECT
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `
    await sql`
      CREATE POLICY notifications_owner_update_policy ON notifications
      FOR UPDATE
      USING (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      )
      WITH CHECK (
        "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        OR (current_setting('request.jwt.claims', true) IS NULL)
      );
    `
    await sql`
      CREATE POLICY notifications_insert_policy ON notifications
      FOR INSERT
      WITH CHECK (true);
    `
    console.log('✓ RLS policies configured for friend_requests, friendships, suggestion_dismissals, member_bonds, notifications')

    // 4. Auto-populate public.profiles on Better Auth user creation (keep neon_auth trigger if present)
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
        DROP TRIGGER IF EXISTS on_auth_user_created ON "user";
      `
      await sql`
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON "user"
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_neon_user();
      `
      console.log('✓ Automatic profile creation trigger configured on public.user')

      try {
        await sql`
          DROP TRIGGER IF EXISTS on_neon_auth_user_created ON neon_auth.user;
        `
        await sql`
          CREATE TRIGGER on_neon_auth_user_created
            AFTER INSERT ON neon_auth.user
            FOR EACH ROW EXECUTE PROCEDURE public.handle_new_neon_user();
        `
      } catch {
        // neon_auth may already be gone after Managed Auth cutover
      }
    } catch (triggerErr) {
      console.warn('⚠️ Could not attach profile creation trigger on public.user:', triggerErr)
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
    await sql`DROP POLICY IF EXISTS changelogs_admin_update_policy ON changelogs;`
    await sql`
      CREATE POLICY changelogs_admin_update_policy ON changelogs
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
            AND profiles.role IN ('admin', 'super_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
            AND profiles.role IN ('admin', 'super_admin')
        )
      );
    `
    await sql`DROP POLICY IF EXISTS changelogs_admin_delete_policy ON changelogs;`
    await sql`
      CREATE POLICY changelogs_admin_delete_policy ON changelogs
      FOR DELETE
      USING (
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

    await sql`DROP POLICY IF EXISTS forum_topics_owner_update_policy ON forum_topics;`
    await sql`CREATE POLICY forum_topics_owner_update_policy ON forum_topics FOR UPDATE USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    ) WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`

    await sql`DROP POLICY IF EXISTS forum_posts_public_read_policy ON forum_posts;`
    await sql`CREATE POLICY forum_posts_public_read_policy ON forum_posts FOR SELECT USING (true);`

    await sql`DROP POLICY IF EXISTS forum_posts_insert_policy ON forum_posts;`
    await sql`CREATE POLICY forum_posts_insert_policy ON forum_posts FOR INSERT WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`

    await sql`DROP POLICY IF EXISTS forum_posts_owner_update_policy ON forum_posts;`
    await sql`CREATE POLICY forum_posts_owner_update_policy ON forum_posts FOR UPDATE USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    ) WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`

    // Enable RLS for forum_votes table
    await sql`ALTER TABLE IF EXISTS forum_votes ENABLE ROW LEVEL SECURITY;`
    await sql`DROP POLICY IF EXISTS forum_votes_public_read_policy ON forum_votes;`
    await sql`CREATE POLICY forum_votes_public_read_policy ON forum_votes FOR SELECT USING (true);`
    await sql`DROP POLICY IF EXISTS forum_votes_owner_insert_policy ON forum_votes;`
    await sql`CREATE POLICY forum_votes_owner_insert_policy ON forum_votes FOR INSERT WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS forum_votes_owner_update_policy ON forum_votes;`
    await sql`CREATE POLICY forum_votes_owner_update_policy ON forum_votes FOR UPDATE USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    ) WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS forum_votes_owner_delete_policy ON forum_votes;`
    await sql`CREATE POLICY forum_votes_owner_delete_policy ON forum_votes FOR DELETE USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`

    await sql`ALTER TABLE IF EXISTS forum_reports ENABLE ROW LEVEL SECURITY;`
    await sql`DROP POLICY IF EXISTS forum_reports_owner_insert_policy ON forum_reports;`
    await sql`CREATE POLICY forum_reports_owner_insert_policy ON forum_reports FOR INSERT WITH CHECK (
      "reporterId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS forum_reports_select_policy ON forum_reports;`
    await sql`CREATE POLICY forum_reports_select_policy ON forum_reports FOR SELECT USING (
      "reporterId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
          AND profiles.role IN ('admin', 'super_admin')
      )
      OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    console.log('✓ RLS policies configured for forum_reports table')

    await sql`ALTER TABLE IF EXISTS forum_topic_visits ENABLE ROW LEVEL SECURITY;`
    await sql`DROP POLICY IF EXISTS forum_topic_visits_owner_select_policy ON forum_topic_visits;`
    await sql`CREATE POLICY forum_topic_visits_owner_select_policy ON forum_topic_visits FOR SELECT USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS forum_topic_visits_owner_insert_policy ON forum_topic_visits;`
    await sql`CREATE POLICY forum_topic_visits_owner_insert_policy ON forum_topic_visits FOR INSERT WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS forum_topic_visits_owner_update_policy ON forum_topic_visits;`
    await sql`CREATE POLICY forum_topic_visits_owner_update_policy ON forum_topic_visits FOR UPDATE USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    ) WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS forum_topic_visits_owner_delete_policy ON forum_topic_visits;`
    await sql`CREATE POLICY forum_topic_visits_owner_delete_policy ON forum_topic_visits FOR DELETE USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`

    await sql`ALTER TABLE IF EXISTS forum_board_visits ENABLE ROW LEVEL SECURITY;`
    await sql`DROP POLICY IF EXISTS forum_board_visits_owner_select_policy ON forum_board_visits;`
    await sql`CREATE POLICY forum_board_visits_owner_select_policy ON forum_board_visits FOR SELECT USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS forum_board_visits_owner_insert_policy ON forum_board_visits;`
    await sql`CREATE POLICY forum_board_visits_owner_insert_policy ON forum_board_visits FOR INSERT WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS forum_board_visits_owner_update_policy ON forum_board_visits;`
    await sql`CREATE POLICY forum_board_visits_owner_update_policy ON forum_board_visits FOR UPDATE USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    ) WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS forum_board_visits_owner_delete_policy ON forum_board_visits;`
    await sql`CREATE POLICY forum_board_visits_owner_delete_policy ON forum_board_visits FOR DELETE USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)
    );`

    await sql`ALTER TABLE IF EXISTS support_tickets ENABLE ROW LEVEL SECURITY;`
    await sql`DROP POLICY IF EXISTS support_tickets_owner_insert_policy ON support_tickets;`
    await sql`CREATE POLICY support_tickets_owner_insert_policy ON support_tickets FOR INSERT WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS support_tickets_owner_select_policy ON support_tickets;`
    await sql`CREATE POLICY support_tickets_owner_select_policy ON support_tickets FOR SELECT USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    console.log('✓ RLS policies configured for support_tickets table')

    // Enable RLS for leads table
    await sql`ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;`
    await sql`DROP POLICY IF EXISTS leads_public_insert_policy ON leads;`
    await sql`CREATE POLICY leads_public_insert_policy ON leads FOR INSERT WITH CHECK (true);`
    await sql`DROP POLICY IF EXISTS leads_admin_read_policy ON leads;`
    await sql`CREATE POLICY leads_admin_read_policy ON leads FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
          AND profiles.role IN ('admin', 'super_admin')
      ) OR (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL)
    );`
    console.log('✓ RLS policies configured for leads table')

    await sql`ALTER TABLE IF EXISTS academy_tracks ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS academy_courses ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS academy_track_courses ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS academy_modules ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS academy_lessons ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS academy_quiz_questions ENABLE ROW LEVEL SECURITY;`
    await sql`ALTER TABLE IF EXISTS academy_certificates ENABLE ROW LEVEL SECURITY;`
    await sql`DROP POLICY IF EXISTS academy_tracks_public_read_policy ON academy_tracks;`
    await sql`CREATE POLICY academy_tracks_public_read_policy ON academy_tracks FOR SELECT USING ("status" = 'published' OR (current_setting('request.jwt.claims', true) IS NULL));`
    await sql`DROP POLICY IF EXISTS academy_courses_public_read_policy ON academy_courses;`
    await sql`CREATE POLICY academy_courses_public_read_policy ON academy_courses FOR SELECT USING ("status" = 'published' OR (current_setting('request.jwt.claims', true) IS NULL));`
    await sql`DROP POLICY IF EXISTS academy_track_courses_public_read_policy ON academy_track_courses;`
    await sql`CREATE POLICY academy_track_courses_public_read_policy ON academy_track_courses FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM academy_tracks t
        WHERE t.id = academy_track_courses."trackId" AND t.status = 'published'
      ) OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS academy_modules_public_read_policy ON academy_modules;`
    await sql`CREATE POLICY academy_modules_public_read_policy ON academy_modules FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM academy_courses c
        WHERE c.id = academy_modules."courseId" AND c.status = 'published'
      ) OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS academy_lessons_public_read_policy ON academy_lessons;`
    await sql`CREATE POLICY academy_lessons_public_read_policy ON academy_lessons FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM academy_courses c
        WHERE c.id = academy_lessons."courseId" AND c.status = 'published'
      ) OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS academy_quiz_questions_public_read_policy ON academy_quiz_questions;`
    await sql`DROP POLICY IF EXISTS academy_quiz_questions_owner_read_policy ON academy_quiz_questions;`
    await sql`CREATE POLICY academy_quiz_questions_owner_read_policy ON academy_quiz_questions FOR SELECT USING (
      (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS academy_certificates_public_read_policy ON academy_certificates;`
    await sql`CREATE POLICY academy_certificates_public_read_policy ON academy_certificates FOR SELECT USING (true);`

    await sql`ALTER TABLE IF EXISTS academy_enrollments ENABLE ROW LEVEL SECURITY;`
    await sql`DROP POLICY IF EXISTS academy_enrollments_owner_select_policy ON academy_enrollments;`
    await sql`CREATE POLICY academy_enrollments_owner_select_policy ON academy_enrollments FOR SELECT USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS academy_enrollments_owner_insert_policy ON academy_enrollments;`
    await sql`CREATE POLICY academy_enrollments_owner_insert_policy ON academy_enrollments FOR INSERT WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS academy_enrollments_owner_update_policy ON academy_enrollments;`
    await sql`CREATE POLICY academy_enrollments_owner_update_policy ON academy_enrollments FOR UPDATE USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    ) WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    );`

    await sql`ALTER TABLE IF EXISTS academy_lesson_progress ENABLE ROW LEVEL SECURITY;`
    await sql`DROP POLICY IF EXISTS academy_lesson_progress_owner_select_policy ON academy_lesson_progress;`
    await sql`CREATE POLICY academy_lesson_progress_owner_select_policy ON academy_lesson_progress FOR SELECT USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS academy_lesson_progress_owner_insert_policy ON academy_lesson_progress;`
    await sql`CREATE POLICY academy_lesson_progress_owner_insert_policy ON academy_lesson_progress FOR INSERT WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS academy_lesson_progress_owner_update_policy ON academy_lesson_progress;`
    await sql`CREATE POLICY academy_lesson_progress_owner_update_policy ON academy_lesson_progress FOR UPDATE USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    ) WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    );`

    await sql`ALTER TABLE IF EXISTS academy_certificate_awards ENABLE ROW LEVEL SECURITY;`
    await sql`DROP POLICY IF EXISTS academy_certificate_awards_owner_select_policy ON academy_certificate_awards;`
    await sql`CREATE POLICY academy_certificate_awards_owner_select_policy ON academy_certificate_awards FOR SELECT USING (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    await sql`DROP POLICY IF EXISTS academy_certificate_awards_owner_insert_policy ON academy_certificate_awards;`
    await sql`CREATE POLICY academy_certificate_awards_owner_insert_policy ON academy_certificate_awards FOR INSERT WITH CHECK (
      "userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
    );`
    console.log('✓ RLS policies configured for Molt Academy tables')

    await applyPremiumColumnGuard()

    console.log('✓ Row Level Security (RLS) policies successfully created!')


  } catch (error) {
    console.error('Error enabling RLS policies:', error)
    process.exit(1)
  }
}

/**
 * JWT-scoped sessions can update their own profile row, but they must not
 * rewrite Premium billing columns. Owner connections (no JWT claim) and an
 * explicit `app.allow_premium_write=on` session may write those columns.
 * Webhooks use the owner connection, so they keep the flags honest.
 */
async function applyPremiumColumnGuard() {
  const columns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'isPremium'
  `
  if (!columns.length) {
    console.log('Skipping Premium column guard; isPremium is not on profiles yet.')
    return
  }

  await sql`
    CREATE OR REPLACE FUNCTION protect_profile_premium_columns()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $fn$
    BEGIN
      IF current_setting('app.allow_premium_write', true) = 'on' THEN
        RETURN NEW;
      END IF;
      IF NULLIF(current_setting('request.jwt.claims', true), '') IS NULL THEN
        RETURN NEW;
      END IF;
      NEW."hasPurchasedPremium" := OLD."hasPurchasedPremium";
      NEW."isPremium" := OLD."isPremium";
      NEW."stripeCustomerId" := OLD."stripeCustomerId";
      NEW."stripeSubscriptionId" := OLD."stripeSubscriptionId";
      NEW."premiumStatus" := OLD."premiumStatus";
      NEW."premiumPeriodEnd" := OLD."premiumPeriodEnd";
      NEW."premiumSyncedAt" := OLD."premiumSyncedAt";
      RETURN NEW;
    END;
    $fn$;
  `
  await sql`DROP TRIGGER IF EXISTS profiles_premium_columns_guard ON profiles;`
  await sql`
    CREATE TRIGGER profiles_premium_columns_guard
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_profile_premium_columns();
  `
  console.log('✓ Premium billing columns are guarded against JWT self-updates')
}

applyRLS()
