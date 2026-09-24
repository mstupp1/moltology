import type { JWTPayload } from 'jose'
import { desc, eq, gt, ilike, isNotNull, or, sql } from 'drizzle-orm'
import { authSession, authUser, forumReports, profiles } from '../../db/schema'
import { getEffectiveRole, isAdminOrSuperAdmin, isSuperAdminEmail } from '../permissions'
import { resolveWriteAuth, type WriteAuthContext, type WriteAuthData } from './write-auth'

const STAFF_DENIED = 'This page is not available.'
const ROLE_DENIED = 'Only a super admin can change clearance.'
const ROLE_SELF = 'You cannot change your own clearance.'
const ROLE_LOCKED = 'This account\'s clearance is locked.'
const MEMBER_MISSING = 'Member not found.'

export const ADMIN_MEMBER_ROLES = ['user', 'admin', 'super_admin'] as const
export type AdminMemberRole = (typeof ADMIN_MEMBER_ROLES)[number]

export const ADMIN_MEMBER_LIMIT = 25
export const ADMIN_PURCHASE_LIMIT = 50

type HandlerArgs<T> = {
  data?: T
  context?: WriteAuthContext | null
}

export type AdminTelemetry = {
  pendingFlags: number
  activeSessions: number
  healthy: boolean
}

export type AdminMemberRow = {
  id: string
  handle: string | null
  larvaId: string
  email: string | null
  role: AdminMemberRole
  isPremium: boolean
  hasPurchasedPremium: boolean
  createdAt: string
  updatedAt: string
}

export type AdminMemberDirectory = {
  viewerCanManageRoles: boolean
  members: AdminMemberRow[]
}

export type AdminPurchaseRow = {
  id: string
  handle: string | null
  larvaId: string
  email: string | null
  isPremium: boolean
  hasPurchasedPremium: boolean
  premiumStatus: string | null
  premiumPeriodEnd: string | null
  moltCredits: string
  chitinGems: number
}

export type AdminRoleChangeReceipt = {
  id: string
  handle: string | null
  role: AdminMemberRole
}

function claimEmail(payload: JWTPayload | null): string | null {
  return payload && typeof payload.email === 'string' ? payload.email : null
}

function asIso(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function asRole(value: string | null | undefined, email: string | null): AdminMemberRole {
  const effective = getEffectiveRole({ email, role: value }, value)
  if (effective === 'admin' || effective === 'super_admin') return effective
  return 'user'
}

async function requireStaff(args: HandlerArgs<WriteAuthData | undefined>) {
  const auth = await resolveWriteAuth({ data: args.data, context: args.context })
  if (!auth) {
    throw new Error('Unauthenticated: Authentication required.')
  }

  const [profile] = await auth.dbClient
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)

  const email = claimEmail(auth.payload)
  if (!isAdminOrSuperAdmin({ email, role: profile?.role }, profile?.role)) {
    throw new Error(STAFF_DENIED)
  }

  return {
    ...auth,
    email,
    viewerCanManageRoles: getEffectiveRole({ email, role: profile?.role }, profile?.role) === 'super_admin',
  }
}

export async function getAdminTelemetryHandler(
  args: HandlerArgs<WriteAuthData | undefined>,
): Promise<AdminTelemetry> {
  const auth = await requireStaff(args)
  try {
    const [openFlags] = await auth.dbClient
      .select({ value: sql<number>`count(*)::int` })
      .from(forumReports)
      .where(eq(forumReports.status, 'open'))

    const [sessions] = await auth.dbClient
      .select({ value: sql<number>`count(*)::int` })
      .from(authSession)
      .where(gt(authSession.expiresAt, new Date()))

    return {
      pendingFlags: Number(openFlags?.value ?? 0),
      activeSessions: Number(sessions?.value ?? 0),
      healthy: true,
    }
  } catch {
    return { pendingFlags: 0, activeSessions: 0, healthy: false }
  }
}

export async function searchAdminMembersHandler(
  args: HandlerArgs<(WriteAuthData & { query?: string }) | undefined>,
): Promise<AdminMemberDirectory> {
  const auth = await requireStaff(args)
  const query = args.data?.query?.trim() ?? ''
  const pattern = `%${query}%`

  const selection = auth.dbClient
    .select({
      id: profiles.id,
      handle: profiles.handle,
      larvaId: profiles.larvaId,
      email: authUser.email,
      role: profiles.role,
      isPremium: profiles.isPremium,
      hasPurchasedPremium: profiles.hasPurchasedPremium,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .leftJoin(authUser, eq(authUser.id, profiles.id))

  const filtered = query
    ? selection.where(
        or(ilike(profiles.handle, pattern), ilike(profiles.larvaId, pattern), ilike(authUser.email, pattern)),
      )
    : selection

  const rows = await filtered.orderBy(desc(profiles.updatedAt)).limit(ADMIN_MEMBER_LIMIT)

  return {
    viewerCanManageRoles: auth.viewerCanManageRoles,
    members: rows.map((row) => ({
      id: row.id,
      handle: row.handle?.trim() || null,
      larvaId: row.larvaId,
      email: row.email ?? null,
      role: asRole(row.role, row.email ?? null),
      isPremium: row.isPremium,
      hasPurchasedPremium: row.hasPurchasedPremium,
      createdAt: asIso(row.createdAt) ?? new Date(0).toISOString(),
      updatedAt: asIso(row.updatedAt) ?? new Date(0).toISOString(),
    })),
  }
}

export async function setAdminMemberRoleHandler(
  args: HandlerArgs<(WriteAuthData & { profileId?: string; role?: string }) | undefined>,
): Promise<AdminRoleChangeReceipt> {
  const auth = await requireStaff(args)
  if (!auth.viewerCanManageRoles) {
    throw new Error(ROLE_DENIED)
  }

  const profileId = args.data?.profileId?.trim() ?? ''
  const nextRole = args.data?.role
  if (!profileId || !ADMIN_MEMBER_ROLES.includes(nextRole as AdminMemberRole)) {
    throw new Error('Choose a valid clearance level.')
  }
  if (profileId === auth.userId) {
    throw new Error(ROLE_SELF)
  }

  const [target] = await auth.dbClient
    .select({
      id: profiles.id,
      handle: profiles.handle,
      role: profiles.role,
      email: authUser.email,
    })
    .from(profiles)
    .leftJoin(authUser, eq(authUser.id, profiles.id))
    .where(eq(profiles.id, profileId))
    .limit(1)

  if (!target) {
    throw new Error(MEMBER_MISSING)
  }
  if (isSuperAdminEmail(target.email)) {
    throw new Error(ROLE_LOCKED)
  }

  const [updated] = await auth.dbClient
    .update(profiles)
    .set({ role: nextRole, updatedAt: new Date() })
    .where(eq(profiles.id, profileId))
    .returning({ id: profiles.id, handle: profiles.handle, role: profiles.role })

  if (!updated) {
    throw new Error(MEMBER_MISSING)
  }

  return {
    id: updated.id,
    handle: updated.handle?.trim() || target.handle?.trim() || null,
    role: asRole(updated.role, null),
  }
}

export async function listAdminPurchasesHandler(
  args: HandlerArgs<WriteAuthData | undefined>,
): Promise<AdminPurchaseRow[]> {
  const auth = await requireStaff(args)
  const rows = await auth.dbClient
    .select({
      id: profiles.id,
      handle: profiles.handle,
      larvaId: profiles.larvaId,
      email: authUser.email,
      isPremium: profiles.isPremium,
      hasPurchasedPremium: profiles.hasPurchasedPremium,
      premiumStatus: profiles.premiumStatus,
      premiumPeriodEnd: profiles.premiumPeriodEnd,
      moltCredits: profiles.moltCredits,
      chitinGems: profiles.chitinGems,
    })
    .from(profiles)
    .leftJoin(authUser, eq(authUser.id, profiles.id))
    .where(
      or(
        eq(profiles.hasPurchasedPremium, true),
        eq(profiles.isPremium, true),
        isNotNull(profiles.stripeCustomerId),
      ),
    )
    .orderBy(desc(profiles.updatedAt))
    .limit(ADMIN_PURCHASE_LIMIT)

  return rows.map((row) => ({
    id: row.id,
    handle: row.handle?.trim() || null,
    larvaId: row.larvaId,
    email: row.email ?? null,
    isPremium: row.isPremium,
    hasPurchasedPremium: row.hasPurchasedPremium,
    premiumStatus: row.premiumStatus,
    premiumPeriodEnd: asIso(row.premiumPeriodEnd),
    moltCredits: String(row.moltCredits),
    chitinGems: row.chitinGems,
  }))
}

export const adminOversightErrors = {
  denied: STAFF_DENIED,
  roleDenied: ROLE_DENIED,
  roleSelf: ROLE_SELF,
  roleLocked: ROLE_LOCKED,
  memberMissing: MEMBER_MISSING,
}
