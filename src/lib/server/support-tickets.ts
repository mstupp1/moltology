import { createHash } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { z } from 'zod'
import { profiles, supportTickets } from '../../db/schema'
import { checkRateLimit } from '../ai/guardrails'
import { resolveMemberPublicName } from '../member-handle'
import {
  SUPPORT_TICKET_BODY_MAX,
  SUPPORT_TICKET_BODY_MIN,
  SUPPORT_TICKET_COPY,
  SUPPORT_TICKET_HONEYPOT_FIELD,
  SUPPORT_TICKET_IP_LIMIT,
  SUPPORT_TICKET_MEMBER_LIMIT,
  SUPPORT_TICKET_RATE_WINDOW_MS,
  SUPPORT_TICKET_SUBJECT_MAX,
  SUPPORT_TICKET_SUBJECT_MIN,
  SUPPORT_TICKET_TURNSTILE_ACTION,
  formatSupportTicketReference,
  isSupportTicketHoneypotTriggered,
  parseSupportTicketCategory,
  parseSupportTicketUrgency,
  validateSupportTicketFields,
} from '../support-tickets'
import { sendSupportTicketEmail } from './mail'
import { verifyTurnstileToken } from './turnstile'
import { resolveWriteAuth } from './write-auth'

export const createSupportTicketSchema = z.object({
  subject: z.string().min(1).max(SUPPORT_TICKET_SUBJECT_MAX + 64),
  body: z.string().min(1).max(SUPPORT_TICKET_BODY_MAX + 256),
  category: z.string().max(64).optional(),
  urgency: z.string().max(32).optional(),
  turnstileToken: z.string().optional(),
  [SUPPORT_TICKET_HONEYPOT_FIELD]: z.string().optional(),
  to: z.string().optional(),
  recipient: z.string().optional(),
  token: z.string().optional(),
  userId: z.string().optional(),
  clientIp: z.string().optional(),
})

export type CreateSupportTicketInput = z.input<typeof createSupportTicketSchema>

export interface CreateSupportTicketResult {
  success: true
  ticketId: string | null
  ticketReference: string | null
}

interface ServerFnArgs<TData = CreateSupportTicketInput> {
  data?: TData
  context?: {
    user?: { sub?: string; id?: string; email?: string | null } | null
    token?: string | null
    db?: any
    clientIp?: string | null
  }
}

export function hashClientIp(ip: string | null | undefined): string | null {
  if (!ip || !ip.trim()) return null
  return createHash('sha256').update(ip.trim()).digest('hex').slice(0, 32)
}

function sessionEmail(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const email = (payload as { email?: unknown }).email
  return typeof email === 'string' && email.trim() ? email.trim() : null
}

export async function createSupportTicketHandler(
  args: ServerFnArgs,
): Promise<CreateSupportTicketResult> {
  const raw = (args.data ?? {}) as Partial<CreateSupportTicketInput>
  if (isSupportTicketHoneypotTriggered(raw[SUPPORT_TICKET_HONEYPOT_FIELD])) {
    return { success: true, ticketId: null, ticketReference: null }
  }

  const data = createSupportTicketSchema.parse(raw)

  let auth
  try {
    auth = await resolveWriteAuth({ data, context: args.context })
  } catch (error) {
    if (error instanceof Error && /Unauthenticated|Unauthorized/.test(error.message)) {
      throw new Error(SUPPORT_TICKET_COPY.unauthenticated)
    }
    throw error
  }
  if (!auth) {
    throw new Error(SUPPORT_TICKET_COPY.unauthenticated)
  }

  const validated = validateSupportTicketFields({
    subject: data.subject,
    body: data.body,
  })
  if (!validated.ok) {
    throw new Error(validated.error)
  }

  const turnstile = await verifyTurnstileToken({
    token: data.turnstileToken,
    expectedAction: SUPPORT_TICKET_TURNSTILE_ACTION,
    ip: args.context?.clientIp || data.clientIp || null,
  })
  if (!turnstile.success) {
    throw new Error(turnstile.errorMessage || SUPPORT_TICKET_COPY.botCheckFailed)
  }

  const { userId, dbClient, payload } = auth
  const clientIp = args.context?.clientIp || data.clientIp || null

  const memberLimit = checkRateLimit(
    `support-ticket:member:${userId}`,
    SUPPORT_TICKET_MEMBER_LIMIT,
    SUPPORT_TICKET_RATE_WINDOW_MS,
  )
  if (!memberLimit.success) {
    throw new Error(SUPPORT_TICKET_COPY.rateLimited)
  }

  if (clientIp) {
    const ipLimit = checkRateLimit(
      `support-ticket:ip:${clientIp}`,
      SUPPORT_TICKET_IP_LIMIT,
      SUPPORT_TICKET_RATE_WINDOW_MS,
    )
    if (!ipLimit.success) {
      throw new Error(SUPPORT_TICKET_COPY.rateLimited)
    }
  }

  const windowStart = new Date(Date.now() - SUPPORT_TICKET_RATE_WINDOW_MS)
  const recent = await dbClient
    .select({ id: supportTickets.id })
    .from(supportTickets)
    .where(and(eq(supportTickets.userId, userId), gt(supportTickets.createdAt, windowStart)))

  if (Array.isArray(recent) && recent.length >= SUPPORT_TICKET_MEMBER_LIMIT) {
    throw new Error(SUPPORT_TICKET_COPY.rateLimited)
  }

  const [userProfile] = await dbClient
    .select({
      handle: profiles.handle,
      larvaId: profiles.larvaId,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  const handle =
    userProfile?.handle ||
    resolveMemberPublicName({
      userId,
      handle: userProfile?.handle,
      larvaId: userProfile?.larvaId,
    })

  const category = parseSupportTicketCategory(data.category)
  const urgency = parseSupportTicketUrgency(data.urgency)
  const memberEmail = sessionEmail(payload)

  const [inserted] = await dbClient
    .insert(supportTickets)
    .values({
      userId,
      handle,
      subject: validated.subject,
      body: validated.body,
      category,
      urgency,
      status: 'open',
      ipHash: hashClientIp(clientIp),
    })
    .returning()

  if (!inserted?.id) {
    throw new Error(SUPPORT_TICKET_COPY.genericError)
  }

  const mail = await sendSupportTicketEmail({
    ticketId: inserted.id,
    memberId: userId,
    handle,
    memberEmail,
    subject: validated.subject,
    body: validated.body,
    category,
    urgency,
    to: data.to,
    recipient: data.recipient,
  })

  if (mail.sent) {
    await dbClient
      .update(supportTickets)
      .set({ emailSentAt: new Date() })
      .where(eq(supportTickets.id, inserted.id))
  }

  return {
    success: true,
    ticketId: inserted.id,
    ticketReference: formatSupportTicketReference(inserted.id),
  }
}

export { SUPPORT_TICKET_SUBJECT_MIN, SUPPORT_TICKET_SUBJECT_MAX, SUPPORT_TICKET_BODY_MIN, SUPPORT_TICKET_BODY_MAX }
