import { neon } from '@neondatabase/serverless'
import { env } from '../env'
import { seedDatabase } from './seed'

async function runMigration() {
  console.log('[MIGRATE] Connecting to Neon PostgreSQL to apply blog schema updates...')
  const sql = neon(env.DATABASE_URL)

  try {
    // 1. Create blog_posts table if it doesn't exist
    await sql(`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "title" text NOT NULL,
        "summary" text NOT NULL,
        "content" text NOT NULL,
        "coverImageUrl" text,
        "authorId" text,
        "authorName" text DEFAULT 'High Ascendant Carcinus' NOT NULL,
        "authorAvatar" text DEFAULT '/images/order_emblem.png' NOT NULL,
        "authorRole" text DEFAULT 'Stage 4 Ascendant' NOT NULL,
        "category" text DEFAULT 'SACRED DOCTRINE' NOT NULL,
        "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "readTimeMinutes" integer DEFAULT 5 NOT NULL,
        "views" integer DEFAULT 0 NOT NULL,
        "likes" integer DEFAULT 0 NOT NULL,
        "isFeatured" boolean DEFAULT false NOT NULL,
        "isPublished" boolean DEFAULT true NOT NULL,
        "publishedAt" timestamp DEFAULT now() NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `)
    console.log('✓ "blog_posts" table created/verified')

    // 2. Create blog_comments table if it doesn't exist
    await sql(`
      CREATE TABLE IF NOT EXISTS "blog_comments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "postId" uuid NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
        "userId" text REFERENCES "profiles"("id") ON DELETE SET NULL,
        "authorName" text DEFAULT 'Ascendant Initiate' NOT NULL,
        "authorAvatar" text DEFAULT '/images/stage1_larva.png' NOT NULL,
        "content" text NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      );
    `)
    console.log('✓ "blog_comments" table created/verified')

    // 3. Enable RLS and create policies
    await sql(`ALTER TABLE "blog_posts" ENABLE ROW LEVEL SECURITY;`)
    await sql(`ALTER TABLE "blog_comments" ENABLE ROW LEVEL SECURITY;`)

    await sql(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'blog_posts_public_read_policy') THEN
          CREATE POLICY "blog_posts_public_read_policy" ON "blog_posts" FOR SELECT USING ("isPublished" = true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'blog_comments_public_read_policy') THEN
          CREATE POLICY "blog_comments_public_read_policy" ON "blog_comments" FOR SELECT USING (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'blog_comments_insert_policy') THEN
          CREATE POLICY "blog_comments_insert_policy" ON "blog_comments" FOR INSERT WITH CHECK ("userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL));
        END IF;
      END $$;
    `)
    console.log('✓ RLS policies applied for blog_posts and blog_comments')

    // Apply admin-role write policies (create/edit) for blog_posts on Neon Data API
    await sql(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'blog_posts_admin_full_policy') THEN
          CREATE POLICY "blog_posts_admin_full_policy" ON "blog_posts" FOR ALL
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM profiles
              WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
                AND profiles.role IN ('admin', 'super_admin')
            )
          );
        END IF;
      END $$;
    `)
    console.log('✓ blog_posts admin create/edit policy applied (role: admin / super_admin)')

    // 4. Seed database with initial blog posts
    console.log('[MIGRATE] Running seed to populate blog_posts in Neon...')
    await seedDatabase()
    console.log('✓ Database seeding complete!')

  } catch (err) {
    console.error('[MIGRATE] Error running blog DB migration:', err)
    process.exit(1)
  }
}

runMigration()
