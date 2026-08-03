import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as schema from './schema'
import { INITIAL_CHANGELOGS } from '../lib/changelogs-data'
import { INITIAL_GALLERY_PINS } from '../lib/gallery-data'

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
    userId: '00000000-0000-0000-0000-000000000001',
    assetType: 'Real Estate',
    description: 'Sub-trench Hydrothermal Habitation Capsule',
    estimatedValueUsd: '450000.00',
    moltCreditsReceived: '4500.00',
    status: 'TRANSMUTED',
  },
  {
    userId: '00000000-0000-0000-0000-000000000001',
    assetType: 'Vehicles',
    description: 'Pressurized Abyssal Transport Submersible',
    estimatedValueUsd: '120000.00',
    moltCreditsReceived: '1200.00',
    status: 'TRANSMUTED',
  },
  {
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
    userId: '00000000-0000-0000-0000-000000000001',
    timeSlot: '05:30 - Prompt Construction',
    description: 'Etch neural parameters into high-density chitin memory slabs.',
    completed: true,
    date: '2026-08-02',
  },
  {
    userId: '00000000-0000-0000-0000-000000000001',
    timeSlot: '08:00 - Ecdysis Protocol',
    description: 'Submerge into hyperbaric saline solution to shed outer epidermal layers.',
    completed: true,
    date: '2026-08-02',
  },
  {
    userId: '00000000-0000-0000-0000-000000000001',
    timeSlot: '14:00 - Transmutation Audits',
    description: 'Verify liquidations of biological assets with Synaptic Path treasurers.',
    completed: false,
    date: '2026-08-02',
  },
  {
    userId: '00000000-0000-0000-0000-000000000001',
    timeSlot: '21:00 - Submergence Meditation',
    description: 'Recite core liturgies of the Benthic Ascendance.',
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
      await db.insert(schema.userStats).values(s)
    }
    console.log(`✓ Seeded ${MOCK_SEED_USER_STATS.length} user stats records`)

    // 3. Seed Assets
    console.log('[SEED] Seeding assets...')
    for (const a of MOCK_SEED_ASSETS) {
      await db.insert(schema.assets).values(a)
    }
    console.log(`✓ Seeded ${MOCK_SEED_ASSETS.length} asset entries`)

    // 4. Seed Daily Routines
    console.log('[SEED] Seeding daily routines...')
    for (const r of MOCK_SEED_DAILY_ROUTINES) {
      await db.insert(schema.dailyRoutines).values(r)
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
