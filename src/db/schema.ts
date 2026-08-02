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
  larvaId: text('larvaId').default('LARVA UNIT #8971').notNull(),
  stage: integer('stage').default(1).notNull(), // 1: Larva, 2: Soft-Shed, 3: Architect, 4: Ascendant
  moltCredits: decimal('moltCredits', { precision: 12, scale: 2 }).default('1450.00').notNull(),
  chitinGems: integer('chitinGems').default(250).notNull(),
  synapseShards: integer('synapseShards').default(45).notNull(),
  depthPressureCoins: integer('depthPressureCoins').default(12).notNull(),
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
  userId: text('userId').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
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
  })
])

// Pinterest Style Gallery Pins Table
export const galleryPins = pgTable('gallery_pins', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').references(() => profiles.id, { onDelete: 'set null' }),
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
