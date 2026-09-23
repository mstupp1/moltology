import { pgTable, pgSchema, text, integer, timestamp, boolean, uuid, decimal, jsonb, pgPolicy, uniqueIndex, index, foreignKey, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import type {
  AcademyCertificateScope,
  AcademyEnrollmentStatus,
  AcademyLessonKind,
  AcademyLevel,
  AcademyProgressStatus,
  AcademyPublishStatus,
  AcademyVideoProvider,
} from '../lib/academy-types'

// Leftover Managed Neon Auth view (do not drop until CoS disables Auth on main).
export const neonAuthSchema = pgSchema('neon_auth')
export const neonAuthUser = neonAuthSchema.table('user', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  image: text('image'),
  emailVerified: boolean('emailVerified'),
})

// Self-hosted Better Auth tables. Profiles still key off auth user id.
export const authUser = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const authSession = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => authUser.id, { onDelete: 'cascade' }),
}, (table) => [
  index('auth_session_userId_idx').on(table.userId),
])

export const authAccount = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => authUser.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => [
  index('auth_account_userId_idx').on(table.userId),
  uniqueIndex('auth_account_provider_account_uidx').on(table.providerId, table.accountId),
])

export const authVerification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
}, (table) => [
  index('auth_verification_identifier_idx').on(table.identifier),
])

export const authJwks = pgTable('jwks', {
  id: text('id').primaryKey(),
  publicKey: text('publicKey').notNull(),
  privateKey: text('privateKey').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  expiresAt: timestamp('expiresAt'),
  alg: text('alg'),
  crv: text('crv'),
})

export type MemberJoinSource = 'organic' | 'word_of_mouth' | 'brought_in'

export type MemberBondKind = 'nest_mate' | 'mentor' | 'brought_in'

export interface SimulatedTrait {
  id: string
  label: string
  description: string
  acquiredAt?: string
}

export type SimulatedDrive = 'status_seeker' | 'contrarian' | 'archivist'

export type SimulatedActivityCadence = 'high' | 'normal' | 'low'

export interface SimulatedPersonaConfig {
  archetype: string
  tone: string
  bio?: string
  activityCadence?: SimulatedActivityCadence
  lastSimulatedAt?: string
  traits?: SimulatedTrait[]
  referredByHandle?: string | null
  /** Internal factional incentive. Never shown in public copy. */
  drive?: SimulatedDrive
  /** Pairwise affinity in [-1, 1]. Positive = ally, negative = methods rivalry. */
  affinities?: Record<string, number>
}

// Moltology Cult User Profiles Table (extends Better Auth user id with domain stats)
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  role: text('role').default('user').notNull(), // 'user' | 'admin' | 'super_admin'
  larvaId: text('larvaId').default('LARVA UNIT #8971').notNull(),
  /** Chosen public designation. Unique case-insensitive. Null until claimed. */
  handle: text('handle'),
  stage: integer('stage').default(1).notNull(), // 1: Larva, 2: Soft-Shed, 3: Architect, 4: Ascendant
  xp: integer('xp').default(0).notNull(),
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
  isSimulated: boolean('isSimulated').default(false).notNull(),
  simulatedPersona: jsonb('simulatedPersona').$type<SimulatedPersonaConfig>(),
  /** How the member found the Order: organic, word of mouth, or brought in. */
  joinSource: text('joinSource').$type<MemberJoinSource>(),
  referredByUserId: text('referredByUserId').references((): AnyPgColumn => profiles.id, { onDelete: 'set null' }),
  /**
   * Paid user: true after at least one successful Premium payment.
   * Distinct from `isPremium`, which is only the current subscription.
   */
  hasPurchasedPremium: boolean('hasPurchasedPremium').default(false).notNull(),
  /** Premium member: true only while the Stripe subscription status is active. */
  isPremium: boolean('isPremium').default(false).notNull(),
  stripeCustomerId: text('stripeCustomerId'),
  stripeSubscriptionId: text('stripeSubscriptionId'),
  /** Latest Stripe subscription status. Null until the first billing event. */
  premiumStatus: text('premiumStatus'),
  premiumPeriodEnd: timestamp('premiumPeriodEnd'),
  /** When the last Premium status write was applied. Older webhook events must not overwrite it. */
  premiumSyncedAt: timestamp('premiumSyncedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('profiles_handle_lower_uidx').on(sql`lower(${table.handle})`),
  index('profiles_referred_by_idx').on(table.referredByUserId),
  uniqueIndex('profiles_stripe_customer_uidx').on(table.stripeCustomerId),
  uniqueIndex('profiles_stripe_subscription_uidx').on(table.stripeSubscriptionId),
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

export type ActivityEventVisibility = 'private' | 'friends' | 'public'

export type ActivityEventMetadata = {
  taskKey?: string
  taskTitle?: string
  time?: string
  date?: string
  streakDays?: number
  bonusXp?: number
  stage?: number
  previousStage?: number
  stageTitle?: string
  completedCount?: number
  totalCount?: number
  peerUserId?: string
  peerHandle?: string
  peerName?: string
  topicId?: string
  topicSlug?: string
  categorySlug?: string
  categoryName?: string
  topicTitle?: string
  postId?: string
  mentionedHandles?: string[]
  consultationCount?: number
  threadId?: string
}

/**
 * Per-member HUD + circle activity stream.
 * Empty table → empty stream. Never seed canned rows.
 * `visibility` gates circle reads; owner always sees their own rows.
 */
export const activityEvents = pgTable('activity_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  detail: text('detail').notNull(),
  valueBadge: text('valueBadge'),
  sourceKey: text('sourceKey').notNull(),
  visibility: text('visibility').$type<ActivityEventVisibility>().default('friends').notNull(),
  metadata: jsonb('metadata').$type<ActivityEventMetadata>().default({}).notNull(),
  href: text('href'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('activity_events_user_source_unique').on(table.userId, table.sourceKey),
  index('activity_events_user_created_idx').on(table.userId, table.createdAt),
  index('activity_events_kind_created_idx').on(table.kind, table.createdAt),
  pgPolicy('activity_events_select_policy', {
    for: 'select',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)
      OR visibility = 'public'
      OR (
        visibility = 'friends'
        AND EXISTS (
          SELECT 1 FROM friendships f
          WHERE (
            (f."userAId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') AND f."userBId" = "userId")
            OR (f."userBId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') AND f."userAId" = "userId")
          )
        )
      )`,
  }),
  pgPolicy('activity_events_owner_insert_policy', {
    for: 'insert',
    withCheck: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('activity_events_owner_update_policy', {
    for: 'update',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
    withCheck: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('activity_events_owner_delete_policy', {
    for: 'delete',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
])

// User XP Transactions Table (Idempotent progression event ledger)
export const xpTransactions = pgTable('xp_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  source: text('source').notNull(), // 'task_completion' | 'all_tasks_bonus' | 'daily_streak' | 'streak_milestone' | 'manual'
  sourceKey: text('sourceKey').notNull(), // Idempotency key, e.g. 'routine:silent-synchronization:2026-09-05'
  description: text('description').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('xp_transactions_user_source_key_unique').on(table.userId, table.sourceKey),
  index('xp_transactions_user_id_idx').on(table.userId),
  pgPolicy('xp_transactions_isolation_policy', {
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
  /** 0–100 Jev quality score. Null until a live evaluation lands. */
  qualityScore: integer('qualityScore'),
  /** Hot hides low-substance topics. Existing rows stay visible. */
  discoveryEligible: boolean('discoveryEligible').default(true).notNull(),
  /** Suggested board slug. The member's chosen category is not moved. */
  suggestedCategory: text('suggestedCategory'),
  lastReplyAt: timestamp('lastReplyAt').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  /** Author withdraw — body is sealed, thread and replies stay. */
  deletedAt: timestamp('deletedAt'),
}, (table) => [
  pgPolicy('forum_topics_public_read_policy', {
    for: 'select',
    using: sql`true`
  }),
  pgPolicy('forum_topics_insert_policy', {
    for: 'insert',
    withCheck: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  }),
  pgPolicy('forum_topics_owner_update_policy', {
    for: 'update',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`,
    withCheck: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// Forum Posts (Replies) Table
export const forumPosts = pgTable('forum_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  topicId: uuid('topicId').notNull().references(() => forumTopics.id, { onDelete: 'cascade' }),
  /** Null = top-level reply to the topic; set = nested reply to another post in the same topic. */
  parentId: uuid('parentId'),
  userId: text('userId').references(() => profiles.id, { onDelete: 'set null' }),
  authorName: text('authorName').default('Ascendant Initiate').notNull(),
  authorAvatar: text('authorAvatar').default('/images/stage1_larva.png').notNull(),
  authorStage: integer('authorStage').default(1).notNull(),
  content: text('content').notNull(),
  upvotes: integer('upvotes').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  /** Author withdraw — body is sealed, nested replies stay. */
  deletedAt: timestamp('deletedAt'),
}, (table) => [
  // Self-FK: deleting a parent promotes children to roots rather than wiping the subtree.
  foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: 'forum_posts_parent_id_fk',
  }).onDelete('set null'),
  index('forum_posts_topic_parent_idx').on(table.topicId, table.parentId),
  index('forum_posts_topic_created_idx').on(table.topicId, table.createdAt),
  pgPolicy('forum_posts_public_read_policy', {
    for: 'select',
    using: sql`true`
  }),
  pgPolicy('forum_posts_insert_policy', {
    for: 'insert',
    withCheck: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  }),
  pgPolicy('forum_posts_owner_update_policy', {
    for: 'update',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`,
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

export type ForumReportStatus = 'open' | 'reviewed'

/** Peer flags. Soft rows only — the target body is not mutated. */
export const forumReports = pgTable('forum_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterId: text('reporterId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  topicId: uuid('topicId').references(() => forumTopics.id, { onDelete: 'cascade' }),
  postId: uuid('postId').references(() => forumPosts.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  note: text('note'),
  status: text('status').default('open').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('forum_reports_open_topic_reporter_uidx')
    .on(table.reporterId, table.topicId)
    .where(sql`${table.status} = 'open' AND ${table.topicId} IS NOT NULL AND ${table.postId} IS NULL`),
  uniqueIndex('forum_reports_open_post_reporter_uidx')
    .on(table.reporterId, table.postId)
    .where(sql`${table.status} = 'open' AND ${table.postId} IS NOT NULL`),
  index('forum_reports_status_created_idx').on(table.status, table.createdAt),
  pgPolicy('forum_reports_owner_insert_policy', {
    for: 'insert',
    withCheck: sql`"reporterId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  }),
  pgPolicy('forum_reports_select_policy', {
    for: 'select',
    using: sql`"reporterId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
          AND profiles.role IN ('admin', 'super_admin')
      )
      OR (current_setting('request.jwt.claims', true) IS NULL)`
  }),
])

const forumVisitOwner = sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`

/** Per-member last look at a topic. Opening the thread upserts lastVisitedAt. */
export const forumTopicVisits = pgTable('forum_topic_visits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  topicId: uuid('topicId').notNull().references(() => forumTopics.id, { onDelete: 'cascade' }),
  lastVisitedAt: timestamp('lastVisitedAt').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('forum_topic_visits_user_topic_unique').on(table.userId, table.topicId),
  index('forum_topic_visits_user_idx').on(table.userId),
  pgPolicy('forum_topic_visits_owner_select_policy', {
    for: 'select',
    using: forumVisitOwner,
  }),
  pgPolicy('forum_topic_visits_owner_insert_policy', {
    for: 'insert',
    withCheck: forumVisitOwner,
  }),
  pgPolicy('forum_topic_visits_owner_update_policy', {
    for: 'update',
    using: forumVisitOwner,
    withCheck: forumVisitOwner,
  }),
  pgPolicy('forum_topic_visits_owner_delete_policy', {
    for: 'delete',
    using: forumVisitOwner,
  }),
])

/** Per-member first-look baseline for a board. Insert-only; never-opened topics after this are new. */
export const forumBoardVisits = pgTable('forum_board_visits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  categoryId: uuid('categoryId').notNull().references(() => forumCategories.id, { onDelete: 'cascade' }),
  lastVisitedAt: timestamp('lastVisitedAt').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('forum_board_visits_user_category_unique').on(table.userId, table.categoryId),
  index('forum_board_visits_user_idx').on(table.userId),
  pgPolicy('forum_board_visits_owner_select_policy', {
    for: 'select',
    using: forumVisitOwner,
  }),
  pgPolicy('forum_board_visits_owner_insert_policy', {
    for: 'insert',
    withCheck: forumVisitOwner,
  }),
  pgPolicy('forum_board_visits_owner_update_policy', {
    for: 'update',
    using: forumVisitOwner,
    withCheck: forumVisitOwner,
  }),
  pgPolicy('forum_board_visits_owner_delete_policy', {
    for: 'delete',
    using: forumVisitOwner,
  }),
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

/** Friend request lifecycle statuses. */
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

/** Notification kinds for the Activity Center. */
export type NotificationKind =
  | 'friend_request'
  | 'friend_accepted'
  | 'friend_rejected'
  | 'forum_mention'
  | 'forum_reply'

export type NotificationPayload = {
  requestId?: string
  profileId?: string
  topicId?: string
  postId?: string
  categorySlug?: string
  topicSlug?: string
  handle?: string
  replyTarget?: 'topic' | 'post'
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

/**
 * Per-viewer permanent hides for Synaptic nearby (and later suggestion strips).
 * Owner-only: the dismissed member never learns they were set aside.
 */
export const suggestionDismissals = pgTable('suggestion_dismissals', {
  id: uuid('id').defaultRandom().primaryKey(),
  viewerId: text('viewerId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  dismissedUserId: text('dismissedUserId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('suggestion_dismissals_viewer_target_uidx').on(table.viewerId, table.dismissedUserId),
  pgPolicy('suggestion_dismissals_owner_select_policy', {
    for: 'select',
    using: sql`"viewerId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('suggestion_dismissals_owner_insert_policy', {
    for: 'insert',
    withCheck: sql`"viewerId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('suggestion_dismissals_owner_delete_policy', {
    for: 'delete',
    using: sql`"viewerId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
])

/**
 * Typed bonds beyond platform friendships: nest-mates, mentors, and brought-in sponsors.
 * `fromUserId` is the sponsor/mentor for directed kinds; nest-mates store lex-ordered ids.
 */
export const memberBonds = pgTable('member_bonds', {
  id: uuid('id').defaultRandom().primaryKey(),
  fromUserId: text('fromUserId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  toUserId: text('toUserId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  kind: text('kind').$type<MemberBondKind>().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('member_bonds_pair_kind_uidx').on(table.fromUserId, table.toUserId, table.kind),
  index('member_bonds_to_user_idx').on(table.toUserId),
  pgPolicy('member_bonds_party_select_policy', {
    for: 'select',
    using: sql`"fromUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "toUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('member_bonds_party_insert_policy', {
    for: 'insert',
    withCheck: sql`"fromUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "toUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('member_bonds_party_delete_policy', {
    for: 'delete',
    using: sql`"fromUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR "toUserId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
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

export type SupportTicketCategory = 'ACCOUNT' | 'BILLING' | 'BUG' | 'OTHER'

export type SupportTicketUrgency = 'NORMAL' | 'HIGH' | 'URGENT'

export type SupportTicketStatus = 'open' | 'closed'

/**
 * Signed-in support intake. Members insert/read their own rows.
 * Guests have no JWT sub, so insert/select fail. Server owner (null claims) can write.
 */
export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  handle: text('handle'),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  category: text('category').$type<SupportTicketCategory>().notNull(),
  urgency: text('urgency').$type<SupportTicketUrgency>().default('NORMAL').notNull(),
  status: text('status').$type<SupportTicketStatus>().default('open').notNull(),
  ipHash: text('ipHash'),
  emailSentAt: timestamp('emailSentAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => [
  index('support_tickets_user_created_idx').on(table.userId, table.createdAt),
  pgPolicy('support_tickets_owner_insert_policy', {
    for: 'insert',
    withCheck: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
  pgPolicy('support_tickets_owner_select_policy', {
    for: 'select',
    using: sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub')
      OR (current_setting('request.jwt.claims', true) IS NULL)`,
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

const academyPublishedOrOwner = sql`"status" = 'published' OR (current_setting('request.jwt.claims', true) IS NULL)`
const academyOwnerOnly = sql`"userId" = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`

/** Learning paths that group courses in a required order. */
export const academyTracks = pgTable('academy_tracks', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  description: text('description').notNull(),
  level: text('level').$type<AcademyLevel>().notNull(),
  coverImageUrl: text('coverImageUrl'),
  estimatedHours: integer('estimatedHours').default(1).notNull(),
  outcomes: jsonb('outcomes').$type<string[]>().default([]).notNull(),
  status: text('status').$type<AcademyPublishStatus>().default('published').notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => [
  index('academy_tracks_status_sort_idx').on(table.status, table.sortOrder),
  pgPolicy('academy_tracks_public_read_policy', {
    for: 'select',
    using: academyPublishedOrOwner,
  }),
])

/** A course is the unit a member enrolls in. */
export const academyCourses = pgTable('academy_courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  level: text('level').$type<AcademyLevel>().notNull(),
  coverImageUrl: text('coverImageUrl'),
  instructorName: text('instructorName').notNull(),
  instructorTitle: text('instructorTitle').notNull(),
  estimatedMinutes: integer('estimatedMinutes').default(30).notNull(),
  outcomes: jsonb('outcomes').$type<string[]>().default([]).notNull(),
  status: text('status').$type<AcademyPublishStatus>().default('draft').notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
  publishedAt: timestamp('publishedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => [
  index('academy_courses_status_sort_idx').on(table.status, table.sortOrder),
  index('academy_courses_category_idx').on(table.category),
  pgPolicy('academy_courses_public_read_policy', {
    for: 'select',
    using: academyPublishedOrOwner,
  }),
])

/** Ordered membership of a course inside a track. */
export const academyTrackCourses = pgTable('academy_track_courses', {
  trackId: uuid('trackId').notNull().references(() => academyTracks.id, { onDelete: 'cascade' }),
  courseId: uuid('courseId').notNull().references(() => academyCourses.id, { onDelete: 'cascade' }),
  sortOrder: integer('sortOrder').default(0).notNull(),
  required: boolean('required').default(true).notNull(),
}, (table) => [
  uniqueIndex('academy_track_courses_pk').on(table.trackId, table.courseId),
  index('academy_track_courses_course_idx').on(table.courseId),
  pgPolicy('academy_track_courses_public_read_policy', {
    for: 'select',
    using: sql`EXISTS (
      SELECT 1 FROM academy_tracks t
      WHERE t.id = academy_track_courses."trackId" AND t.status = 'published'
    ) OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
])

/** A module is a section inside a course syllabus. */
export const academyModules = pgTable('academy_modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('courseId').notNull().references(() => academyCourses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary').default('').notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
}, (table) => [
  index('academy_modules_course_sort_idx').on(table.courseId, table.sortOrder),
  pgPolicy('academy_modules_public_read_policy', {
    for: 'select',
    using: sql`EXISTS (
      SELECT 1 FROM academy_courses c
      WHERE c.id = academy_modules."courseId" AND c.status = 'published'
    ) OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
])

/** A lesson is a video lecture, a reading, or a quiz. */
export const academyLessons = pgTable('academy_lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('courseId').notNull().references(() => academyCourses.id, { onDelete: 'cascade' }),
  moduleId: uuid('moduleId').notNull().references(() => academyModules.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  summary: text('summary').default('').notNull(),
  kind: text('kind').$type<AcademyLessonKind>().notNull(),
  durationSeconds: integer('durationSeconds').default(0).notNull(),
  videoUrl: text('videoUrl'),
  videoProvider: text('videoProvider').$type<AcademyVideoProvider>(),
  posterUrl: text('posterUrl'),
  body: text('body'),
  isPreview: boolean('isPreview').default(false).notNull(),
  passingScore: integer('passingScore').default(80).notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
}, (table) => [
  uniqueIndex('academy_lessons_course_slug_uidx').on(table.courseId, table.slug),
  index('academy_lessons_module_sort_idx').on(table.moduleId, table.sortOrder),
  pgPolicy('academy_lessons_public_read_policy', {
    for: 'select',
    using: sql`EXISTS (
      SELECT 1 FROM academy_courses c
      WHERE c.id = academy_lessons."courseId" AND c.status = 'published'
    ) OR (current_setting('request.jwt.claims', true) IS NULL)`,
  }),
])

export const academyQuizQuestions = pgTable('academy_quiz_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonId: uuid('lessonId').notNull().references(() => academyLessons.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  choices: jsonb('choices').$type<string[]>().default([]).notNull(),
  correctIndex: integer('correctIndex').notNull(),
  explanation: text('explanation').default('').notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
}, (table) => [
  index('academy_quiz_questions_lesson_sort_idx').on(table.lessonId, table.sortOrder),
  pgPolicy('academy_quiz_questions_owner_read_policy', {
    for: 'select',
    using: sql`(current_setting('request.jwt.claims', true) IS NULL)`,
  }),
])

export const academyEnrollments = pgTable('academy_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  courseId: uuid('courseId').notNull().references(() => academyCourses.id, { onDelete: 'cascade' }),
  status: text('status').$type<AcademyEnrollmentStatus>().default('active').notNull(),
  enrolledAt: timestamp('enrolledAt').defaultNow().notNull(),
  completedAt: timestamp('completedAt'),
}, (table) => [
  uniqueIndex('academy_enrollments_user_course_uidx').on(table.userId, table.courseId),
  index('academy_enrollments_user_idx').on(table.userId),
  pgPolicy('academy_enrollments_owner_select_policy', { for: 'select', using: academyOwnerOnly }),
  pgPolicy('academy_enrollments_owner_insert_policy', { for: 'insert', withCheck: academyOwnerOnly }),
  pgPolicy('academy_enrollments_owner_update_policy', {
    for: 'update',
    using: academyOwnerOnly,
    withCheck: academyOwnerOnly,
  }),
])

export const academyLessonProgress = pgTable('academy_lesson_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  lessonId: uuid('lessonId').notNull().references(() => academyLessons.id, { onDelete: 'cascade' }),
  courseId: uuid('courseId').notNull().references(() => academyCourses.id, { onDelete: 'cascade' }),
  status: text('status').$type<AcademyProgressStatus>().default('in_progress').notNull(),
  progressPercent: integer('progressPercent').default(0).notNull(),
  lastPositionSeconds: integer('lastPositionSeconds').default(0).notNull(),
  quizScore: integer('quizScore'),
  quizPassed: boolean('quizPassed').default(false).notNull(),
  note: text('note'),
  completedAt: timestamp('completedAt'),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('academy_lesson_progress_user_lesson_uidx').on(table.userId, table.lessonId),
  index('academy_lesson_progress_user_course_idx').on(table.userId, table.courseId),
  pgPolicy('academy_lesson_progress_owner_select_policy', { for: 'select', using: academyOwnerOnly }),
  pgPolicy('academy_lesson_progress_owner_insert_policy', { for: 'insert', withCheck: academyOwnerOnly }),
  pgPolicy('academy_lesson_progress_owner_update_policy', {
    for: 'update',
    using: academyOwnerOnly,
    withCheck: academyOwnerOnly,
  }),
])

/** Certificate template earned by finishing a course or a track. */
export const academyCertificates = pgTable('academy_certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  scope: text('scope').$type<AcademyCertificateScope>().notNull(),
  courseId: uuid('courseId').references(() => academyCourses.id, { onDelete: 'cascade' }),
  trackId: uuid('trackId').references(() => academyTracks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
}, (table) => [
  uniqueIndex('academy_certificates_course_uidx').on(table.courseId),
  uniqueIndex('academy_certificates_track_uidx').on(table.trackId),
  pgPolicy('academy_certificates_public_read_policy', {
    for: 'select',
    using: sql`true`,
  }),
])

/** Issued credential. credentialId is the public code printed on the certificate. */
export const academyCertificateAwards = pgTable('academy_certificate_awards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  certificateId: uuid('certificateId').notNull().references(() => academyCertificates.id, { onDelete: 'cascade' }),
  credentialId: text('credentialId').notNull().unique(),
  issuedAt: timestamp('issuedAt').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('academy_certificate_awards_user_cert_uidx').on(table.userId, table.certificateId),
  pgPolicy('academy_certificate_awards_owner_select_policy', { for: 'select', using: academyOwnerOnly }),
  pgPolicy('academy_certificate_awards_owner_insert_policy', { for: 'insert', withCheck: academyOwnerOnly }),
])
