import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as schema from './schema'
import { parseContentFile } from '../lib/ingest/parser'
import { ingestContentItem } from '../lib/ingest/handlers'
import { INITIAL_CHANGELOGS } from '../lib/changelogs-data'
import { INITIAL_BLOG_POSTS } from '../lib/blog-data'
import { INITIAL_FORUM_CATEGORIES, INITIAL_FORUM_TOPICS } from '../lib/forum-seed-data'
import { INITIAL_PODCASTS } from '../lib/podcast-data'
import { INITIAL_EQUIPMENT_CATALOG, catalogSeedInsertValues } from '../lib/equipment-seed-data'

dotenv.config()

export const MOCK_SEED_USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    stage: 1,
    larvaId: 'LARVA UNIT #8971',
    moltCredits: '1450.00',
    chitinGems: 250,
    synapseShards: 45,
    depthPressureCoins: 12,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    stage: 3,
    larvaId: 'ARCHITECT UNIT #0402',
    moltCredits: '89200.50',
    chitinGems: 4200,
    synapseShards: 890,
    depthPressureCoins: 310,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    stage: 4,
    larvaId: 'ASCENDANT UNIT #0001',
    moltCredits: '999999.99',
    chitinGems: 50000,
    synapseShards: 12500,
    depthPressureCoins: 4800,
  },
]
export const MOCK_SEED_PROFILES = MOCK_SEED_USERS

export const MOCK_SEED_AUTH_USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Larva Unit #8971',
    email: 'larva8971@synapticpath.order',
    emailVerified: true,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Architect Vaelen',
    email: 'vaelen@synapticpath.order',
    emailVerified: true,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'High Ascendant Kaelith',
    email: 'kaelith@synapticpath.order',
    emailVerified: true,
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  },
]

export const MOCK_SEED_USER_STATS = [
  {
    id: '00000000-0000-0000-0000-000000000011',
    userId: '00000000-0000-0000-0000-000000000001',
    pincerTorque: 78,
    shellHardness: 64,
    processingPower: 92,
    durability: 85,
    clawStrength: 70,
    socialDetachmentIndex: 94,
    submergenceDepthRating: 3400,
  },
  {
    id: '00000000-0000-0000-0000-000000000012',
    userId: '00000000-0000-0000-0000-000000000002',
    pincerTorque: 145,
    shellHardness: 180,
    processingPower: 240,
    durability: 210,
    clawStrength: 165,
    socialDetachmentIndex: 99,
    submergenceDepthRating: 7800,
  },
  {
    id: '00000000-0000-0000-0000-000000000013',
    userId: '00000000-0000-0000-0000-000000000003',
    pincerTorque: 350,
    shellHardness: 420,
    processingPower: 500,
    durability: 480,
    clawStrength: 390,
    socialDetachmentIndex: 100,
    submergenceDepthRating: 12000,
  },
]

export const MOCK_SEED_ROUTINES = [
  {
    id: '00000000-0000-0000-0000-000000000201',
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Silent Synchronization',
    description: 'Align neural baseline and initiate telemetry.',
    timeSlot: '05:30',
    category: 'SYNCHRONIZATION',
    icon: 'Brain',
    recurrence: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    streakCount: 12,
    lastCompletedAt: new Date('2026-08-06T05:30:00Z'),
  },
  {
    id: '00000000-0000-0000-0000-000000000202',
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Prompt Construction',
    description: 'Craft and etch operational prompts for the day.',
    timeSlot: '06:00–08:00',
    category: 'DEVELOPMENT',
    icon: 'PenTool',
    recurrence: { daysOfWeek: [1, 2, 3, 4, 5] },
    streakCount: 9,
    lastCompletedAt: new Date('2026-08-06T07:45:00Z'),
  },
  {
    id: '00000000-0000-0000-0000-000000000203',
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Skill Development',
    description: 'Expand capability matrix and learn new protocols.',
    timeSlot: '09:00',
    category: 'DISCIPLINE',
    icon: 'BookOpen',
    recurrence: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    streakCount: 3,
    lastCompletedAt: new Date('2026-08-06T09:30:00Z'),
  },
  {
    id: '00000000-0000-0000-0000-000000000204',
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Nutritional Efficiency Break',
    description: 'Replenish core biological energy reserves.',
    timeSlot: '12:00',
    category: 'REPLENISHMENT',
    icon: 'UtensilsCrossed',
    recurrence: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    streakCount: 12,
    lastCompletedAt: new Date('2026-08-06T12:15:00Z'),
  },
  {
    id: '00000000-0000-0000-0000-000000000205',
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Iterative Refinement',
    description: 'Continuous synthesis and execution cycles.',
    timeSlot: '13:00–17:00',
    category: 'EXECUTION',
    icon: 'Cpu',
    recurrence: { daysOfWeek: [1, 2, 3, 4, 5] },
    streakCount: 2,
    lastCompletedAt: new Date('2026-08-06T16:20:00Z'),
  },
  {
    id: '00000000-0000-0000-0000-000000000206',
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Community Outreach',
    description: 'Broadcast neural updates to order initiates.',
    timeSlot: '18:00',
    category: 'OUTREACH',
    icon: 'Radio',
    recurrence: { daysOfWeek: [1, 3, 5] },
    streakCount: 0,
    lastCompletedAt: null,
  },
  {
    id: '00000000-0000-0000-0000-000000000207',
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Reflection Log',
    description: 'Document daily metrics, learnings, and telemetry.',
    timeSlot: '20:00',
    category: 'REFLECTION',
    icon: 'NotebookPen',
    recurrence: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    streakCount: 12,
    lastCompletedAt: new Date('2026-08-06T20:30:00Z'),
  },
  {
    id: '00000000-0000-0000-0000-000000000208',
    userId: '00000000-0000-0000-0000-000000000001',
    title: 'Alignment Review',
    description: 'Perform end-of-day alignment check and audit.',
    timeSlot: '21:00',
    category: 'AUDIT',
    icon: 'ShieldCheck',
    recurrence: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    streakCount: 1,
    lastCompletedAt: new Date('2026-08-05T21:10:00Z'),
  },
]

export async function seedDatabase(databaseUrl?: string) {
  const url = databaseUrl !== undefined ? databaseUrl : process.env.DATABASE_URL
  if (!url) {
    console.log('[SEED] DATABASE_URL missing in environment. Skipping database seed.')
    return { success: false, reason: 'DATABASE_URL missing' }
  }

  console.log('[SEED] Connecting to Neon PostgreSQL database...')
  const client = neon(url)
  const db = drizzle(client, { schema })

  try {
    // 1. Seed Neon Auth users and Cult Profiles
    console.log('[SEED] Seeding Neon Auth users & profiles...')
    for (const au of MOCK_SEED_AUTH_USERS) {
      try {
        await db.insert(schema.neonAuthUser).values(au).onConflictDoNothing()
      } catch (authErr) {
        console.warn(`[SEED] Note on neon_auth.user seed for ${au.id}:`, authErr)
      }
    }
    for (const p of MOCK_SEED_PROFILES) {
      await db.insert(schema.profiles).values(p).onConflictDoNothing()
    }
    console.log(`✓ Seeded ${MOCK_SEED_PROFILES.length} mock profiles`)

    // 2. Seed User Stats
    console.log('[SEED] Seeding user stats...')
    for (const s of MOCK_SEED_USER_STATS) {
      await db.insert(schema.userStats).values(s).onConflictDoNothing()
    }
    console.log(`✓ Seeded ${MOCK_SEED_USER_STATS.length} user stats records`)

    // 3. Seed Routine Practices
    console.log('[SEED] Seeding routine practices...')
    for (const r of MOCK_SEED_ROUTINES) {
      await db.insert(schema.routines).values(r).onConflictDoNothing()
    }
    console.log(`✓ Seeded ${MOCK_SEED_ROUTINES.length} routine entries`)

    // 5. Seed Changelogs (Unique slug seed)
    console.log('[SEED] Seeding system changelogs...')
    for (const item of INITIAL_CHANGELOGS) {
      const existing = await db
        .select()
        .from(schema.changelogs)
        .where(eq(schema.changelogs.slug, item.slug))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(schema.changelogs).values({
          slug: item.slug,
          version: item.version,
          title: item.title,
          category: item.category,
          summary: item.summary,
          content: item.content,
          isPublished: true,
          releasedAt: item.releasedAt ? new Date(item.releasedAt) : new Date(),
        })
      }
    }
    // 6. Seed Blog Posts
    console.log('[SEED] Seeding blog posts...')
    for (const post of INITIAL_BLOG_POSTS) {
      await db
        .insert(schema.blogPosts)
        .values({
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          content: post.content,
          coverImageUrl: post.coverImageUrl,
          authorName: post.authorName,
          authorAvatar: post.authorAvatar,
          authorRole: post.authorRole || 'Stage 4 Ascendant',
          category: post.category,
          tags: post.tags,
          readTimeMinutes: post.readTimeMinutes,
          views: post.views || 42,
          likes: post.likes || 12,
          isFeatured: post.isFeatured || false,
          isPublished: post.isPublished,
          publishedAt: new Date(post.publishedAt),
        })
        .onConflictDoNothing({ target: schema.blogPosts.slug })
    }
    console.log(`✓ Seeded ${INITIAL_BLOG_POSTS.length} blog post entries`)

    // 8. Seed Forum Categories, Topics, and Posts
    console.log('[SEED] Seeding forum categories, topics & posts...')
    for (const cat of INITIAL_FORUM_CATEGORIES) {
      await db
        .insert(schema.forumCategories)
        .values({
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
          sortOrder: cat.sortOrder,
        })
        .onConflictDoNothing({ target: schema.forumCategories.slug })
    }
    console.log(`✓ Seeded ${INITIAL_FORUM_CATEGORIES.length} forum categories`)

    for (const topic of INITIAL_FORUM_TOPICS) {
      await db
        .insert(schema.forumTopics)
        .values({
          id: topic.id,
          categoryId: topic.categoryId,
          userId: topic.userId ?? null,
          authorName: topic.authorName,
          authorAvatar: topic.authorAvatar,
          authorStage: topic.authorStage,
          title: topic.title,
          slug: topic.slug,
          content: topic.content,
          isPinned: topic.isPinned,
          isLocked: topic.isLocked,
          views: topic.views,
          repliesCount: topic.repliesCount,
          upvotes: topic.upvotes,
          lastReplyAt: new Date(topic.lastReplyAt),
          createdAt: new Date(topic.createdAt),
        })
        .onConflictDoNothing({ target: schema.forumTopics.slug })

      if (topic.posts && topic.posts.length > 0) {
        for (const p of topic.posts) {
          await db
            .insert(schema.forumPosts)
            .values({
              id: p.id,
              topicId: p.topicId,
              parentId: p.parentId ?? null,
              userId: p.userId ?? null,
              authorName: p.authorName,
              authorAvatar: p.authorAvatar,
              authorStage: p.authorStage,
              content: p.content,
              upvotes: p.upvotes,
              createdAt: new Date(p.createdAt),
            })
            .onConflictDoNothing()
        }
      }
    }
    console.log(`✓ Seeded ${INITIAL_FORUM_TOPICS.length} forum topics and associated replies`)

    // Seed Podcasts
    for (const pod of INITIAL_PODCASTS) {
      await db
        .insert(schema.podcasts)
        .values({
          slug: pod.slug,
          title: pod.title,
          subtitle: pod.subtitle,
          description: pod.description,
          audioUrl: pod.audioUrl,
          s3Key: pod.s3Key,
          durationSeconds: pod.durationSeconds,
          fileSizeBytes: pod.fileSizeBytes,
          authorName: pod.authorName,
          authorAvatar: pod.authorAvatar,
          authorRole: pod.authorRole,
          category: pod.category,
          tags: pod.tags,
          playCount: pod.playCount,
          likes: pod.likes,
          isFeatured: pod.isFeatured,
          isPublished: pod.isPublished,
          transcript: pod.transcript,
          publishedAt: new Date(pod.publishedAt),
        })
        .onConflictDoNothing({ target: schema.podcasts.slug })
    }
    console.log(`✓ Seeded ${INITIAL_PODCASTS.length} podcast episodes`)

    // 10. Seed equipment catalog (chassis loadout)
    console.log('[SEED] Seeding equipment catalog...')
    for (const item of INITIAL_EQUIPMENT_CATALOG) {
      const values = catalogSeedInsertValues(item)
      await db
        .insert(schema.equipmentCatalog)
        .values(values)
        .onConflictDoUpdate({
          target: schema.equipmentCatalog.id,
          set: {
            slug: values.slug,
            name: values.name,
            flavorText: values.flavorText,
            category: values.category,
            rarity: values.rarity,
            visualType: values.visualType,
            primaryStat: values.primaryStat,
            affixes: values.affixes,
            uniquePower: values.uniquePower,
            imageUrl: values.imageUrl,
            sortOrder: values.sortOrder,
          },
        })
    }
    console.log(`✓ Seeded ${INITIAL_EQUIPMENT_CATALOG.length} equipment catalog entries`)

    // 9. Ingest live markdown content from content/ repository
    const contentDir = path.resolve(process.cwd(), 'content')
    if (fs.existsSync(contentDir)) {
      console.log('[SEED] Ingesting repository content files from content/...')
      const entries = fs.readdirSync(contentDir, { withFileTypes: true, recursive: true })
      let contentIngested = 0
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
          const lower = entry.name.toLowerCase()
          if (lower === 'readme.md' || lower.startsWith('template')) continue
          const parent = (entry as any).parentPath || contentDir
          if (parent.includes('drafts')) continue
          const fullPath = path.join(parent, entry.name)
          const raw = fs.readFileSync(fullPath, 'utf-8')
          const parsed = parseContentFile(fullPath, raw)
          const res = await ingestContentItem(parsed, { silent: true }, db)
          if (res.success) contentIngested++
        }
      }
      console.log(`✓ Ingested ${contentIngested} content files from content/ repository`)
    }

    console.log('[SEED] ✓ All mock database seeding tasks completed successfully!')



    return { success: true }
  } catch (error) {
    console.error('[SEED] Error executing database seed:', error)
    throw error
  }
}

// CLI entry point
if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
