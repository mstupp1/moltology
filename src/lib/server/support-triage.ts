import { DEFAULT_ORACLE_MODEL_ID, getOracleGenerationOptions } from '../ai/oracle-models'
import { LAYA_GATEWAY_MODEL_ID, evaluateWithJev } from '../quality/jev'
import {
  SUPPORT_TICKET_SUBJECT_MAX,
  isSupportTicketCategory,
  isSupportTicketUrgency,
  supportTicketFallbackSubject,
  type SupportTicketCategoryId,
  type SupportTicketUrgencyId,
} from '../support-tickets'

/** Laya budget. A miss files the ticket as Other / Normal. */
export const SUPPORT_TRIAGE_TIMEOUT_MS = 1_500

/** Summary budget. A miss uses the first words of the message. */
export const SUPPORT_SUMMARY_TIMEOUT_MS = 4_000

/** Free Oracle model, the same one that names Oracle chats. */
export const SUPPORT_SUMMARY_MODEL_ID = DEFAULT_ORACLE_MODEL_ID

const TOPIC_CRITERIA: Record<SupportTicketCategoryId, string> = {
  ACCOUNT: 'Signing in, email, password, profile, settings, privacy, or deleting an account.',
  BILLING: 'Payments, charges, refunds, Oracle MAX, store orders, shipping, or Market purchases.',
  BUG: 'Something in the app is broken, missing, slow, or shows an error.',
  OTHER: 'Feedback, ideas, partnership, press, or anything that fits none of the others.',
}

const PRIORITY_CRITERIA: Record<SupportTicketUrgencyId, string> = {
  NORMAL: 'A question, idea, or a problem with an easy workaround.',
  HIGH: 'The member is blocked from a main feature or was charged incorrectly.',
  URGENT: 'Locked out of the account, a suspected security issue, lost money, or the whole site is down.',
}

export const SUPPORT_TRIAGE_QUESTIONS = {
  topic: {
    type: 'choice' as const,
    instructions: 'Pick the topic of this support message.',
    criteria: TOPIC_CRITERIA,
  },
  priority: {
    type: 'choice' as const,
    instructions: 'Pick how urgently support should reply. Most messages are normal.',
    criteria: PRIORITY_CRITERIA,
  },
}

export interface SupportTriage {
  category: SupportTicketCategoryId
  urgency: SupportTicketUrgencyId
  subject: string
  /** 'laya' when Laya picked topic and priority, 'fallback' when it was unavailable. */
  triageSource: 'laya' | 'fallback'
  summarySource: 'model' | 'fallback'
}

type TriageAnswers = { topic?: { choice?: string }; priority?: { choice?: string } }

export interface SupportTriageDeps {
  classify?: (body: string) => Promise<TriageAnswers | null>
  summarize?: (body: string) => Promise<string | null>
}

async function classifyWithLaya(body: string): Promise<TriageAnswers | null> {
  const result = await evaluateWithJev({
    state: body,
    questions: SUPPORT_TRIAGE_QUESTIONS,
    model: LAYA_GATEWAY_MODEL_ID,
    timeoutMs: SUPPORT_TRIAGE_TIMEOUT_MS,
    disallowPromptTraining: true,
  })
  return (result?.answers as TriageAnswers | undefined) ?? null
}

async function summarizeWithFreeModel(body: string): Promise<string | null> {
  if (process.env.VITEST === 'true') return null
  try {
    const { generateText } = await import('ai')
    const result = await generateText({
      model: SUPPORT_SUMMARY_MODEL_ID as any,
      ...getOracleGenerationOptions(SUPPORT_SUMMARY_MODEL_ID),
      system:
        'Write a subject line for this support message in 3 to 8 plain words. Output only the subject, without quotes, markdown, or a prefix.',
      prompt: body,
      maxOutputTokens: 32,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(SUPPORT_SUMMARY_TIMEOUT_MS),
    })
    return result.text ?? null
  } catch (err) {
    console.warn('[support] Summary unavailable:', err instanceof Error ? err.message : err)
    return null
  }
}

export function cleanSupportSummary(raw: string | null | undefined): string | null {
  if (!raw) return null
  const clean = raw
    .split('\n')[0]
    .replace(/^(subject|title):\s*/i, '')
    .replace(/[*_#`]/g, '')
    .replace(/^["']+|["']+$/g, '')
    .replace(/\.+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.length >= 3 ? clean.slice(0, SUPPORT_TICKET_SUBJECT_MAX) : null
}

/**
 * Topic and priority from Laya, subject line from the free Oracle model. Both run at
 * once and either can fail without blocking the ticket.
 */
export async function triageSupportTicket(body: string, deps: SupportTriageDeps = {}): Promise<SupportTriage> {
  const classify = deps.classify ?? classifyWithLaya
  const summarize = deps.summarize ?? summarizeWithFreeModel

  const [answers, summary] = await Promise.all([
    classify(body).catch(() => null),
    summarize(body).catch(() => null),
  ])

  const topic = answers?.topic?.choice?.toUpperCase()
  const priority = answers?.priority?.choice?.toUpperCase()
  const topicOk = Boolean(topic && isSupportTicketCategory(topic))
  const priorityOk = Boolean(priority && isSupportTicketUrgency(priority))
  const subject = cleanSupportSummary(summary)

  return {
    category: topicOk ? (topic as SupportTicketCategoryId) : 'OTHER',
    urgency: priorityOk ? (priority as SupportTicketUrgencyId) : 'NORMAL',
    subject: subject ?? supportTicketFallbackSubject(body),
    triageSource: topicOk || priorityOk ? 'laya' : 'fallback',
    summarySource: subject ? 'model' : 'fallback',
  }
}
