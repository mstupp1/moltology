import { z } from 'zod'
import { checkRateLimit } from '../ai/guardrails'
import {
  CONTACT_COPY,
  CONTACT_EMAIL_LIMIT,
  CONTACT_HONEYPOT_FIELD,
  CONTACT_IP_LIMIT,
  CONTACT_MESSAGE_MAX,
  CONTACT_NAME_MAX,
  CONTACT_RATE_WINDOW_MS,
  CONTACT_TURNSTILE_ACTION,
  isContactHoneypotTriggered,
  parseContactTopic,
  validateContactFields,
} from '../contact-form'
import { sendContactFormEmail } from './mail'
import { verifyTurnstileToken } from './turnstile'
import { requestEmailOptIn } from './email-opt-in'

export const submitContactFormSchema = z.object({
  name: z.string().max(CONTACT_NAME_MAX + 64),
  email: z.string().max(320),
  topic: z.string().max(32).optional(),
  message: z.string().max(CONTACT_MESSAGE_MAX + 256),
  emailOptIn: z.boolean().optional(),
  turnstileToken: z.string().optional(),
  [CONTACT_HONEYPOT_FIELD]: z.string().optional(),
})

export type SubmitContactFormInput = z.input<typeof submitContactFormSchema>

interface ServerFnArgs {
  data?: SubmitContactFormInput
  context?: { clientIp?: string | null } | null
}

/**
 * Public /org contact form. Same delivery path as support tickets: a Resend email
 * to support@moltology.org with reply-to set to the sender. Nothing is stored,
 * so a failed send is reported to the visitor instead of silently dropped.
 */
export async function submitContactFormHandler(args: ServerFnArgs): Promise<{ success: true; marketingStatus?: 'pending' | 'subscribed' | 'error' }> {
  const raw = (args.data ?? {}) as Partial<SubmitContactFormInput>
  if (isContactHoneypotTriggered(raw[CONTACT_HONEYPOT_FIELD])) {
    return { success: true }
  }

  const data = submitContactFormSchema.parse(raw)
  const validated = validateContactFields(data)
  if (!validated.ok) {
    throw new Error(validated.error)
  }

  const clientIp = args.context?.clientIp || null
  const turnstile = await verifyTurnstileToken({
    token: data.turnstileToken,
    expectedAction: CONTACT_TURNSTILE_ACTION,
    ip: clientIp,
  })
  if (!turnstile.success) {
    throw new Error(turnstile.errorMessage || CONTACT_COPY.botCheckFailed)
  }

  if (clientIp) {
    const ipLimit = checkRateLimit(`contact:ip:${clientIp}`, CONTACT_IP_LIMIT, CONTACT_RATE_WINDOW_MS)
    if (!ipLimit.success) throw new Error(CONTACT_COPY.rateLimited)
  }
  const emailLimit = checkRateLimit(
    `contact:email:${validated.email}`,
    CONTACT_EMAIL_LIMIT,
    CONTACT_RATE_WINDOW_MS,
  )
  if (!emailLimit.success) throw new Error(CONTACT_COPY.rateLimited)

  const mail = await sendContactFormEmail({
    name: validated.name,
    email: validated.email,
    topic: parseContactTopic(data.topic),
    message: validated.message,
  })
  if (!mail.sent) {
    throw new Error(CONTACT_COPY.genericError)
  }

  if (data.emailOptIn) {
    const result = await requestEmailOptIn(validated.email, 'org_contact')
    return { success: true, marketingStatus: result.status }
  }

  return { success: true }
}
