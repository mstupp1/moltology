import { pgTable, text, integer, timestamp, boolean, uuid, decimal, jsonb, pgPolicy } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Users Table with Moltism Extensions
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  
  // Cult Stage & Stats
  stage: integer('stage').default(1).notNull(), // 1: Larva, 2: Soft-Shed, 3: Architect, 4: Ascendant
  larvaId: text('larvaId').default('LARVA UNIT #8971').notNull(),
  moltCredits: decimal('moltCredits', { precision: 12, scale: 2 }).default('1450.00').notNull(),
  chitinGems: integer('chitinGems').default(250).notNull(),
  synapseShards: integer('synapseShards').default(45).notNull(),
  depthPressureCoins: integer('depthPressureCoins').default(12).notNull(),
}, (table) => [
  pgPolicy('users_isolation_policy', {
    for: 'all',
    using: sql`id = (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub') OR (current_setting('request.jwt.claims', true) IS NULL)`
  })
])

// User Biometric Stats Table (Moltmaxxing Dashboard)
export const userStats = pgTable('user_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
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

// Better Auth Sessions Table
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
})

// Better Auth Accounts Table
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

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
  })
])

// Pinterest Style Gallery Pins Table
export const galleryPins = pgTable('gallery_pins', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  prompt: text('prompt'),
  s3Key: text('s3Key').notNull(),
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


