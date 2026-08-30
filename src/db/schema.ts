import { pgTable, pgSchema, text, integer, timestamp, boolean, uuid, decimal, jsonb, pgPolicy, uniqueIndex } from 'drizzle-orm/pg-core'
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
  /** DiceBear avatar config: { style, seed } — rendered client-side */
  avatarConfig: jsonb('avatarConfig').$type<{
    style: string
    seed: string
  }>(),
  emailOptIn: boolean('emailOptIn').default(false).notNull(),
  emailOptInAt: timestamp('emailOptInAt'),
  emailOptInSource: text('emailOptInSource'),
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
  moltmaxScore: integer('moltmaxScore'),
  moltmaxClearance: text('moltmaxClearance'),
  moltmaxStage: text('moltmaxStage'),
  moltmaxDimensionScores: jsonb('moltmaxDimensionScores').$type<Record<string, number>>(),
  moltmaxCompletedAt: timestamp('moltmaxCompletedAt'),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => [
  pgPolicy('user_stats_isolation_policy', {
    for: 'all',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Routine Alignment Practices Table (Recurring, streak-tracked daily rituals)
export const routines = pgTable('routines', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  timeSlot: text('timeSlot').notNull(), // e.g. "05:30", "06:00–08:00"
  category: text('category').default('DISCIPLINE').notNull(),
  icon: text('icon').default('Activity').notNull(),
  recurrence: jsonb('recurrence').$type<{ daysOfWeek: number[] }>().default({ daysOfWeek: [] }).notNull(), // 0=Sun..6=Sat, empty = every day
  streakCount: integer('streakCount').default(0).notNull(),
  lastCompletedAt: timestamp('lastCompletedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => [
  pgPolicy('routines_isolation_policy', {
    for: 'all',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Daily Routine Completions Table (Per-day task completion log)
export const routineCompletions = pgTable('routine_completions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  taskKey: text('taskKey').notNull(),
  completedOn: text('completedOn').notNull(), // 'YYYY-MM-DD'
  completedAt: timestamp('completedAt').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('routine_completions_user_task_date_unique').on(table.userId, table.taskKey, table.completedOn),
  pgPolicy('routine_completions_isolation_policy', {
    for: 'all',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

/** Per-member HUD activity stream. Empty table → empty stream. Never seed canned rows. */
export const activityEvents = pgTable('activity_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  detail: text('detail').notNull(),
  valueBadge: text('valueBadge'),
  sourceKey: text('sourceKey').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('activity_events_user_source_unique').on(table.userId, table.sourceKey),
  pgPolicy('activity_events_isolation_policy', {
    for: 'all',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Public System Transmutation Changelogs Table
export const changelogs = pgTable('changelogs', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  version: text('version').default('v1.0.0').notNull(),
  title: text('title').notNull(),
  category: text('category').default('Feature').notNull(), // Feature, Improvement, Fix, Performance, Security, Design, etc.
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
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
  }),
  pgPolicy('changelogs_admin_update_policy', {
    for: 'update',
    using: sql`EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        AND profiles.role IN ('admin', 'super_admin')
    )`,
    withCheck: sql`EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        AND profiles.role IN ('admin', 'super_admin')
    )`
  }),
  pgPolicy('changelogs_admin_delete_policy', {
    for: 'delete',
    using: sql`EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        AND profiles.role IN ('admin', 'super_admin')
    )`
  })
])

// Generic AI Conversations & Threads Table
export const aiThreads = pgTable('ai_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').default('Ascendance Consultation').notNull(),
  persona: text('persona').default('oracle').notNull(),
  pinnedAt: timestamp('pinnedAt'),
  archivedAt: timestamp('archivedAt'),
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

// Forum Votes Table (one toggleable vote per user per topic or reply)
export const forumVotes = pgTable('forum_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  topicId: uuid('topicId').references(() => forumTopics.id, { onDelete: 'cascade' }),
  postId: uuid('postId').references(() => forumPosts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('forum_votes_topic_user_unique').on(table.userId, table.topicId),
  uniqueIndex('forum_votes_post_user_unique').on(table.userId, table.postId),
  pgPolicy('forum_votes_public_read_policy', {
    for: 'select',
    using: sql`true`
  }),
  pgPolicy('forum_votes_owner_insert_policy', {
    for: 'insert',
    withCheck: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  }),
  pgPolicy('forum_votes_owner_update_policy', {
    for: 'update',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`,
    withCheck: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  }),
  pgPolicy('forum_votes_owner_delete_policy', {
    for: 'delete',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
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

/** Chassis equipment categories (equip slots). */
export type EquipmentCategory = 'carapace' | 'claws' | 'head' | 'legs' | 'antennae' | 'belt'

/** Paper-doll hardpoint ids — claws use dual sub-slots. */
export type EquipSlotId =
  | Exclude<EquipmentCategory, 'claws'>
  | 'claws-1'
  | 'claws-2'

/** Classic rarity ladder for chassis gear. */
export type EquipmentRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/** Shared 9:16 art key — one image per visual type, not per catalog row. */
export type ChassisVisualType = 'helm' | 'carapace' | 'pincer' | 'hammer' | 'antennae' | 'greaves' | 'belt'

export type EquipmentAffix = {
  stat: 'defense' | 'attack' | 'intelligence' | 'speed' | 'perception'
  value: number
}

export type EquipmentUniquePower = {
  name: string
  description: string
}

// Global equipment catalog (public read)
export const equipmentCatalog = pgTable('equipment_catalog', {
  id: uuid('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  flavorText: text('flavorText').notNull(),
  category: text('category').$type<EquipmentCategory>().notNull(),
  rarity: text('rarity').$type<EquipmentRarity>().notNull(),
  visualType: text('visualType').$type<ChassisVisualType>().default('carapace').notNull(),
  primaryStat: integer('primaryStat').notNull(),
  affixes: jsonb('affixes').$type<EquipmentAffix[]>().default([]).notNull(),
  uniquePower: jsonb('uniquePower').$type<EquipmentUniquePower | null>(),
  imageUrl: text('imageUrl'),
  sortOrder: integer('sortOrder').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('equipment_catalog_public_read_policy', {
    for: 'select',
    using: sql`true`
  })
])

// Owned gear instances — equipped or vaulted
export const userGearItems = pgTable('user_gear_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  catalogItemId: uuid('catalogItemId').notNull().references(() => equipmentCatalog.id, { onDelete: 'restrict' }),
  equippedSlot: text('equippedSlot').$type<EquipSlotId | 'claws'>(),
  vaultIndex: integer('vaultIndex'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('user_gear_items_isolation_policy', {
    for: 'all',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  }),
  // Partial unique: only enforce when slot/index is set (Postgres allows multiple NULLs either way)
  uniqueIndex('user_gear_equipped_slot_uidx')
    .on(table.userId, table.equippedSlot)
    .where(sql`"equippedSlot" IS NOT NULL`),
  uniqueIndex('user_gear_vault_index_uidx')
    .on(table.userId, table.vaultIndex)
    .where(sql`"vaultIndex" IS NOT NULL`),
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

/** Friend request lifecycle statuses. */
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

/** Notification kinds for the Activity Center. */
export type NotificationKind = 'friend_request' | 'friend_accepted' | 'friend_rejected'

export type NotificationPayload = {
  requestId?: string
  profileId?: string
}

// Friend requests between members
export const friendRequests = pgTable('friend_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: text('senderId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  recipientId: text('recipientId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').$type<FriendRequestStatus>().default('pending').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  respondedAt: timestamp('respondedAt'),
}, (table) => [
  uniqueIndex('friend_requests_pending_pair_uidx')
    .on(table.senderId, table.recipientId)
    .where(sql`status = 'pending'`),
  pgPolicy('friend_requests_party_select_policy', {
    for: 'select',
    using: sql`"senderId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "recipientId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('friend_requests_sender_insert_policy', {
    for: 'insert',
    withCheck: sql`"senderId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('friend_requests_party_update_policy', {
    for: 'update',
    using: sql`"senderId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "recipientId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
    withCheck: sql`"senderId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "recipientId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
])

/** Normalized friendship pairs — always store userAId < userBId lexicographically. */
export const friendships = pgTable('friendships', {
  id: uuid('id').defaultRandom().primaryKey(),
  userAId: text('userAId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  userBId: text('userBId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('friendships_pair_uidx').on(table.userAId, table.userBId),
  pgPolicy('friendships_party_select_policy', {
    for: 'select',
    using: sql`"userAId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "userBId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('friendships_party_insert_policy', {
    for: 'insert',
    withCheck: sql`"userAId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "userBId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('friendships_party_delete_policy', {
    for: 'delete',
    using: sql`"userAId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "userBId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
])

// Persistent Activity Center notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  kind: text('kind').$type<NotificationKind>().notNull(),
  actorUserId: text('actorUserId').references(() => profiles.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  detail: text('detail').notNull(),
  payload: jsonb('payload').$type<NotificationPayload>().default({}).notNull(),
  readAt: timestamp('readAt'),
  sourceKey: text('sourceKey').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('notifications_user_source_unique').on(table.userId, table.sourceKey),
  pgPolicy('notifications_owner_select_policy', {
    for: 'select',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('notifications_owner_update_policy', {
    for: 'update',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
    withCheck: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('notifications_insert_policy', {
    for: 'insert',
    withCheck: sql`true`,
  }),
])

// Top-of-Funnel Leads & Guide Downloads Table
export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  source: text('source').default('moltmax_guide').notNull(),
  referrer: text('referrer'),
  claimedPdf: boolean('claimedPdf').default(true).notNull(),
  convertedToUser: boolean('convertedToUser').default(false).notNull(),
  emailOptIn: boolean('emailOptIn').default(false).notNull(),
  emailOptInAt: timestamp('emailOptInAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => [
  pgPolicy('leads_public_insert_policy', {
    for: 'insert',
    withCheck: sql`true`
  }),
  pgPolicy('leads_admin_read_policy', {
    for: 'select',
    using: sql`EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
        AND profiles.role IN ('admin', 'super_admin')
    ) OR (NULLIF(current_setting('request.jwt.claims', true), '') IS NULL)`
  })
])
