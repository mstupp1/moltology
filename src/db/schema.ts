import { pgTable, text, integer, timestamp, boolean, uuid, decimal, jsonb } from 'drizzle-orm/pg-core'

// Better Auth Users Table with Moltism Extensions
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
})

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
})

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
})

// Daily Alignment Routines
export const dailyRoutines = pgTable('daily_routines', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  timeSlot: text('timeSlot').notNull(), // e.g. "05:30 - Prompt Construction"
  description: text('description').notNull(),
  completed: boolean('completed').default(false).notNull(),
  date: text('date').notNull(),
})

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
