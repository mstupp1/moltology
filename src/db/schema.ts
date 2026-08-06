import { pgTable, pgSchema, text, integer, timestamp, boolean, uuid, decimal, jsonb, pgPolicy } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Neon Managed Auth Schema Reference
export const neonAuthSchema = pgSchema('neon_auth')
export const neonAuthUser = neonAuthSchema.table('user', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  image: text('image'),
  emailVerified: boolean('emailVerified'),
})

// Moltology Cult User Profiles Table (Extends neon_auth.user with domain stats)
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  role: text('role').default('user').notNull(), // 'user' | 'admin' | 'super_admin'
  larvaId: text('larvaId').default('LARVA UNIT #8971').notNull(),
  stage: integer('stage').default(1).notNull(), // 1: Larva, 2: Soft-Shed, 3: Architect, 4: Ascendant
  moltCredits: decimal('moltCredits', { precision: 12, scale: 2 }).default('1450.00').notNull(),
  chitinGems: integer('chitinGems').default(250).notNull(),
  synapseShards: integer('synapseShards').default(45).notNull(),
  depthPressureCoins: integer('depthPressureCoins').default(12).notNull(),
  activeAvatarId: text('activeAvatarId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => [
  pgPolicy('profiles_isolation_policy', {
    for: 'all',
    using: sql`id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Alias users export to profiles for backward compatibility if needed
export const users = profiles

// User Biometric Stats Table (Moltmaxxing Dashboard)
export const userStats = pgTable('user_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().unique().references(() => profiles.id, { onDelete: 'cascade' }),
  pincerTorque: integer('pincerTorque').default(78).notNull(),
  shellHardness: integer('shellHardness').default(64).notNull(),
  processingPower: integer('processingPower').default(92).notNull(),
  durability: integer('durability').default(85).notNull(),
  clawStrength: integer('clawStrength').default(70).notNull(),
  socialDetachmentIndex: integer('socialDetachmentIndex').default(94).notNull(),
  submergenceDepthRating: integer('submergenceDepthRating').default(3400).notNull(), // in fathoms
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => [
  pgPolicy('user_stats_isolation_policy', {
    for: 'all',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Liquidated Assets Table
export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  assetType: text('assetType').notNull(), // Real Estate, Vehicles, Luxury Goods, Cash Reserves
  description: text('description').notNull(),
  estimatedValueUsd: decimal('estimatedValueUsd', { precision: 12, scale: 2 }).notNull(),
  moltCreditsReceived: decimal('moltCreditsReceived', { precision: 12, scale: 2 }).notNull(),
  status: text('status').default('TRANSMUTED').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => [
  pgPolicy('assets_isolation_policy', {
    for: 'all',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Daily Alignment Routines
export const dailyRoutines = pgTable('daily_routines', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  timeSlot: text('timeSlot').notNull(), // e.g. "05:30 - Prompt Construction"
  description: text('description').notNull(),
  completed: boolean('completed').default(false).notNull(),
  date: text('date').notNull(),
}, (table) => [
  pgPolicy('daily_routines_isolation_policy', {
    for: 'all',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Public System Transmutation Changelogs Table
export const changelogs = pgTable('changelogs', {
  id: uuid('id').defaultRandom().primaryKey(),
  version: text('version').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(), // TRANSMUTATION, CHASSIS_UPGRADE, SECURITY_ISOLATION, BUG_PURGE
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  isPublished: boolean('isPublished').default(true).notNull(),
  releasedAt: timestamp('releasedAt').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('changelogs_public_read_policy', {
    for: 'select',
    using: sql`true`
  }),
  pgPolicy('changelogs_admin_insert_policy', {
    for: 'insert',
    withCheck: sql`EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        AND profiles.role IN ('admin', 'super_admin')
    )`
  })
])

// Pinterest Style Gallery Pins Table
export const galleryPins = pgTable('gallery_pins', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').references(() => profiles.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  prompt: text('prompt'),
  s3Key: text('s3Key').notNull().unique(),
  imageUrl: text('imageUrl').notNull(),
  aspectRatio: text('aspectRatio').default('3:4').notNull(), // '3:4', '1:1', '9:16', '4:3', '2:3'
  category: text('category').default('SACRED DOCTRINE').notNull(), // 'SACRED DOCTRINE', 'BIOMECHANICAL', 'CARCINIZATION', 'LARVAL STAGES', 'DEEP ABYSS', 'SYNAPTIC HARDWARE'
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  authorName: text('authorName').default('High Ascendant Carcinus').notNull(),
  authorAvatar: text('authorAvatar').default('/images/order_emblem.png').notNull(),
  authorStage: text('authorStage').default('Stage 4 Ascendant').notNull(),
  pinCount: integer('pinCount').default(42).notNull(),
  views: integer('views').default(128).notNull(),
  likes: integer('likes').default(19).notNull(),
  isPreloaded: boolean('isPreloaded').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('gallery_pins_public_read_policy', {
    for: 'select',
    using: sql`true`
  })
])

// Generic AI Conversations & Threads Table
export const aiThreads = pgTable('ai_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').default('Ascendance Consultation').notNull(),
  persona: text('persona').default('oracle').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('ai_threads_isolation_policy', {
    for: 'all',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Generic AI Messages Table
export const aiMessages = pgTable('ai_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('threadId').notNull().references(() => aiThreads.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  parts: jsonb('parts').$type<Record<string, unknown>[]>().default([]).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('ai_messages_isolation_policy', {
    for: 'all',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Blog Posts Table
export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  coverImageUrl: text('coverImageUrl'),
  authorId: text('authorId').references(() => profiles.id, { onDelete: 'set null' }),
  authorName: text('authorName').default('High Ascendant Carcinus').notNull(),
  authorAvatar: text('authorAvatar').default('/images/order_emblem.png').notNull(),
  authorRole: text('authorRole').default('Stage 4 Ascendant').notNull(),
  category: text('category').default('SACRED DOCTRINE').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  readTimeMinutes: integer('readTimeMinutes').default(5).notNull(),
  views: integer('views').default(0).notNull(),
  likes: integer('likes').default(0).notNull(),
  isFeatured: boolean('isFeatured').default(false).notNull(),
  isPublished: boolean('isPublished').default(true).notNull(),
  publishedAt: timestamp('publishedAt').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('blog_posts_public_read_policy', {
    for: 'select',
    using: sql`"isPublished" = true`
  }),
  pgPolicy('blog_posts_admin_full_policy', {
    for: 'all',
    using: sql`
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
          AND profiles.role IN ('admin', 'super_admin')
      )
    `,
    withCheck: sql`
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
          AND profiles.role IN ('admin', 'super_admin')
      )
    `
  })
])

// Blog Post Comments Table
export const blogComments = pgTable('blog_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('postId').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  userId: text('userId').references(() => profiles.id, { onDelete: 'set null' }),
  authorName: text('authorName').default('Ascendant Initiate').notNull(),
  authorAvatar: text('authorAvatar').default('/images/stage1_larva.png').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('blog_comments_public_read_policy', {
    for: 'select',
    using: sql`true`
  }),
  pgPolicy('blog_comments_insert_policy', {
    for: 'insert',
    withCheck: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Forum Categories Table
export const forumCategories = pgTable('forum_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').default('MessageSquare').notNull(),
  color: text('color').default('#00ffff').notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('forum_categories_public_read_policy', {
    for: 'select',
    using: sql`true`
  })
])

// Forum Topics (Threads) Table
export const forumTopics = pgTable('forum_topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('categoryId').notNull().references(() => forumCategories.id, { onDelete: 'cascade' }),
  userId: text('userId').references(() => profiles.id, { onDelete: 'set null' }),
  authorName: text('authorName').default('Ascendant Initiate').notNull(),
  authorAvatar: text('authorAvatar').default('/images/stage1_larva.png').notNull(),
  authorStage: integer('authorStage').default(1).notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  isPinned: boolean('isPinned').default(false).notNull(),
  isLocked: boolean('isLocked').default(false).notNull(),
  views: integer('views').default(0).notNull(),
  repliesCount: integer('repliesCount').default(0).notNull(),
  upvotes: integer('upvotes').default(0).notNull(),
  lastReplyAt: timestamp('lastReplyAt').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('forum_topics_public_read_policy', {
    for: 'select',
    using: sql`true`
  }),
  pgPolicy('forum_topics_insert_policy', {
    for: 'insert',
    withCheck: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Forum Posts (Replies) Table
export const forumPosts = pgTable('forum_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  topicId: uuid('topicId').notNull().references(() => forumTopics.id, { onDelete: 'cascade' }),
  userId: text('userId').references(() => profiles.id, { onDelete: 'set null' }),
  authorName: text('authorName').default('Ascendant Initiate').notNull(),
  authorAvatar: text('authorAvatar').default('/images/stage1_larva.png').notNull(),
  authorStage: integer('authorStage').default(1).notNull(),
  content: text('content').notNull(),
  upvotes: integer('upvotes').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('forum_posts_public_read_policy', {
    for: 'select',
    using: sql`true`
  }),
  pgPolicy('forum_posts_insert_policy', {
    for: 'insert',
    withCheck: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// User Custom Mutated Avatars Vault Table
export const userAvatars = pgTable('user_avatars', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').default('Carcinized Unit').notNull(),
  stage: integer('stage').default(1).notNull(), // 1 to 4
  carcinizationLevel: integer('carcinizationLevel').default(50).notNull(), // 0-100
  cyberneticsLevel: integer('cyberneticsLevel').default(50).notNull(), // 0-100
  cosmetics: jsonb('cosmetics').$type<string[]>().default([]).notNull(), // array of equipped item IDs
  imageUrl: text('imageUrl').notNull(),
  isActive: boolean('isActive').default(false).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('user_avatars_isolation_policy', {
    for: 'all',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Podcasts / Audio Transmissions Table
export const podcasts = pgTable('podcasts', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description').notNull(),
  audioUrl: text('audioUrl').notNull(),
  s3Key: text('s3Key'),
  durationSeconds: integer('durationSeconds').notNull(),
  fileSizeBytes: integer('fileSizeBytes'),
  authorName: text('authorName').default('High Ascendant Carcinus').notNull(),
  authorAvatar: text('authorAvatar').default('/images/order_emblem.png').notNull(),
  authorRole: text('authorRole').default('Stage 4 Ascendant').notNull(),
  category: text('category').default('TRANSMISSION').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  playCount: integer('playCount').default(0).notNull(),
  likes: integer('likes').default(0).notNull(),
  isFeatured: boolean('isFeatured').default(false).notNull(),
  isPublished: boolean('isPublished').default(true).notNull(),
  transcript: text('transcript'),
  publishedAt: timestamp('publishedAt').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('podcasts_public_read_policy', {
    for: 'select',
    using: sql`"isPublished" = true`
  })
])





