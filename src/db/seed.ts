import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as schema from './schema'
import { INITIAL_CHANGELOGS } from '../lib/changelogs-data'
import { INITIAL_GALLERY_PINS } from '../lib/gallery-data'
import { INITIAL_BLOG_POSTS } from '../lib/blog-data'
import { INITIAL_FORUM_CATEGORIES, INITIAL_FORUM_TOPICS } from '../lib/forum-seed-data'
import { INITIAL_PODCASTS } from '../lib/podcast-data'



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

export const MOCK_SEED_ASSETS = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    userId: '00000000-0000-0000-0000-000000000001',
    assetType: 'Real Estate',
    description: 'Sub-trench Hydrothermal Habitation Capsule',
    estimatedValueUsd: '450000.00',
    moltCreditsReceived: '4500.00',
    status: 'TRANSMUTED',
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    userId: '00000000-0000-0000-0000-000000000001',
    assetType: 'Vehicles',
    description: 'Pressurized Abyssal Transport Submersible',
    estimatedValueUsd: '120000.00',
    moltCreditsReceived: '1200.00',
    status: 'TRANSMUTED',
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    userId: '00000000-0000-0000-0000-000000000002',
    assetType: 'Luxury Goods',
    description: 'Benthic Titanium Exo-Skeleton Alloy',
    estimatedValueUsd: '850000.00',
    moltCreditsReceived: '8500.00',
    status: 'TRANSMUTED',
  },
]

export const MOCK_SEED_DAILY_ROUTINES = [
  {
    id: '00000000-0000-0000-0000-000000000201',
    userId: '00000000-0000-0000-0000-000000000001',
    timeSlot: '05:30',
    description: 'Silent Synchronization — Align neural baseline and initiate telemetry.',
    completed: true,
    date: '2026-08-02',
  },
  {
    id: '00000000-0000-0000-0000-000000000202',
    userId: '00000000-0000-0000-0000-000000000001',
    timeSlot: '06:00–08:00',
    description: 'Prompt Construction — Craft and etch operational prompts.',
    completed: true,
    date: '2026-08-02',
  },
  {
    id: '00000000-0000-0000-0000-000000000203',
    userId: '00000000-0000-0000-0000-000000000001',
    timeSlot: '09:00',
    description: 'Skill Development — Expand capability matrix and learn new protocols.',
    completed: true,
    date: '2026-08-02',
  },
  {
    id: '00000000-0000-0000-0000-000000000204',
    userId: '00000000-0000-0000-0000-000000000001',
    timeSlot: '12:00',
    description: 'Nutritional Efficiency Break — Replenish core biological energy.',
    completed: false,
    date: '2026-08-02',
  },
  {
    id: '00000000-0000-0000-0000-000000000205',
    userId: '00000000-0000-0000-0000-000000000001',
    timeSlot: '13:00–17:00',
    description: 'Iterative Refinement — Continuous synthesis and execution cycles.',
    completed: false,
    date: '2026-08-02',
  },
  {
    id: '00000000-0000-0000-0000-000000000206',
    userId: '00000000-0000-0000-0000-000000000001',
    timeSlot: '18:00',
    description: 'Community Outreach — Broadcast neural updates to order initiates.',
    completed: false,
    date: '2026-08-02',
  },
  {
    id: '00000000-0000-0000-0000-000000000207',
    userId: '00000000-0000-0000-0000-000000000001',
    timeSlot: '20:00',
    description: 'Reflection Log — Document daily metrics, learnings, and telemetry.',
    completed: false,
    date: '2026-08-02',
  },
  {
    id: '00000000-0000-0000-0000-000000000208',
    userId: '00000000-0000-0000-0000-000000000001',
    timeSlot: '21:00',
    description: 'Alignment Review — Perform end-of-day alignment check and audit.',
    completed: false,
    date: '2026-08-02',
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

    // 3. Seed Assets
    console.log('[SEED] Seeding assets...')
    for (const a of MOCK_SEED_ASSETS) {
      await db.insert(schema.assets).values(a).onConflictDoNothing()
    }
    console.log(`✓ Seeded ${MOCK_SEED_ASSETS.length} asset entries`)

    // 4. Seed Daily Routines
    console.log('[SEED] Seeding daily routines...')
    for (const r of MOCK_SEED_DAILY_ROUTINES) {
      await db.insert(schema.dailyRoutines).values(r).onConflictDoNothing()
    }
    console.log(`✓ Seeded ${MOCK_SEED_DAILY_ROUTINES.length} daily routine entries`)

    // 5. Seed Changelogs (Unique version seed)
    console.log('[SEED] Seeding system changelogs...')
    for (const item of INITIAL_CHANGELOGS) {
      const existing = await db
        .select()
        .from(schema.changelogs)
        .where(eq(schema.changelogs.version, item.version))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(schema.changelogs).values({
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
    // 6. Seed Gallery Pins
    console.log('[SEED] Seeding gallery pins...')
    for (const pin of INITIAL_GALLERY_PINS) {
      await db
        .insert(schema.galleryPins)
        .values({
          title: pin.title,
          description: pin.description,
          prompt: pin.prompt,
          s3Key: pin.s3Key,
          imageUrl: pin.imageUrl,
          aspectRatio: pin.aspectRatio,
          category: pin.category,
          tags: pin.tags,
          authorName: pin.authorName,
          authorAvatar: pin.authorAvatar,
          authorStage: pin.authorStage,
          pinCount: pin.pinCount,
          views: pin.views,
          likes: pin.likes,
          isPreloaded: true,
          createdAt: new Date(pin.createdAt),
        })
        .onConflictDoNothing({ target: schema.galleryPins.s3Key })
    }
    console.log(`✓ Seeded ${INITIAL_GALLERY_PINS.length} gallery pin entries`)

    // 7. Seed Blog Posts
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
          userId: topic.userId,
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
              userId: p.userId,
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
