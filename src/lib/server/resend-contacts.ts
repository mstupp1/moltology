import { env } from '../../env'

/** Event-driven marketing contacts. Transactional email never creates a contact. */
export type MarketingGroup = 'leads' | 'users'
export interface ResendContact { id: string; email: string; unsubscribed: boolean }

export const MARKETING_UPDATE_ERROR = 'Could not update your email subscription. Please try again.'

async function contactRequest(path: string, method = 'GET', body?: unknown): Promise<any> {
  const key = process.env.RESEND_API_KEY ?? env.RESEND_API_KEY
  if (!key) throw new Error(MARKETING_UPDATE_ERROR)
  const response = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(8000),
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(MARKETING_UPDATE_ERROR)
  return response.json()
}

export function getResendContact(email: string): Promise<ResendContact | null> {
  return contactRequest(`/contacts/${encodeURIComponent(email.trim().toLowerCase())}`)
}

function segments() {
  const leads = process.env.RESEND_LEADS_SEGMENT_ID ?? env.RESEND_LEADS_SEGMENT_ID
  const users = process.env.RESEND_USERS_SEGMENT_ID ?? env.RESEND_USERS_SEGMENT_ID
  const all = process.env.RESEND_ALL_SUBSCRIBERS_SEGMENT_ID ?? env.RESEND_ALL_SUBSCRIBERS_SEGMENT_ID
  if (!leads || !users || !all) throw new Error(MARKETING_UPDATE_ERROR)
  return { leads, users, all }
}

/** Only an explicit, confirmed opt-in may set unsubscribed=false. */
export async function subscribeResendContact(email: string, group: MarketingGroup): Promise<void> {
  const ids = segments()
  const normalized = email.trim().toLowerCase()
  let contact = await getResendContact(normalized)
  if (!contact) {
    contact = await contactRequest('/contacts', 'POST', { email: normalized, unsubscribed: true })
  }
  if (!contact) throw new Error(MARKETING_UPDATE_ERROR)
  // Assign targeting before activation so partially completed calls cannot send to the wrong group.
  await assignSegments(contact.id, group, ids)
  if (!await contactRequest(`/contacts/${contact.id}`, 'PATCH', { unsubscribed: false })) throw new Error(MARKETING_UPDATE_ERROR)
}

async function assignSegments(id: string, group: MarketingGroup, ids = segments()) {
  for (const segmentId of [ids.all, ids[group]]) {
    if (!await contactRequest(`/contacts/${id}/segments/${segmentId}`, 'POST')) throw new Error(MARKETING_UPDATE_ERROR)
  }
  await contactRequest(`/contacts/${id}/segments/${ids[group === 'users' ? 'leads' : 'users']}`, 'DELETE')
}

/** Conversion updates an existing contact only, without changing its subscription. */
export async function moveResendContactToUsers(email: string): Promise<void> {
  const contact = await getResendContact(email)
  if (contact) await assignSegments(contact.id, 'users')
}

export async function unsubscribeResendContact(email: string): Promise<void> {
  const contact = await getResendContact(email)
  if (contact) await contactRequest(`/contacts/${contact.id}`, 'PATCH', { unsubscribed: true })
}
