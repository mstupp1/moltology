import { afterAll, describe, expect, it } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../db'
import { authAccount, authSession, authUser, profiles, userStats } from '../db/schema'
import { auth } from './auth-server'

const dummyUrl =
  typeof process !== 'undefined' &&
  (process.env.DATABASE_URL || '').includes('ep-dummy')

function readSetCookie(response: Response): string {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] }
  const many = headers.getSetCookie?.() ?? []
  if (many.length > 0) return many.map((cookie) => cookie.split(';')[0]).join('; ')
  const single = response.headers.get('set-cookie')
  return single ? single.split(';')[0] : ''
}

async function callAuth(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `http://localhost:3000/api/auth${path}`
  return auth.handler(new Request(url, init))
}

describe.skipIf(dummyUrl)('Better Auth email/password against Neon dev', () => {
  const email = `probe-auth-${Date.now()}@moltology.org`
  const password = 'probe-password-126'
  const name = 'probe_auth_126'
  let userId: string | null = null

  afterAll(async () => {
    if (!userId) return
    const db = getDb()
    await db.delete(authSession).where(eq(authSession.userId, userId)).catch(() => {})
    await db.delete(authAccount).where(eq(authAccount.userId, userId)).catch(() => {})
    await db.delete(userStats).where(eq(userStats.userId, userId)).catch(() => {})
    await db.delete(profiles).where(eq(profiles.id, userId)).catch(() => {})
    await db.delete(authUser).where(and(eq(authUser.id, userId), eq(authUser.email, email))).catch(() => {})
  })

  it('signs up, signs in, reads a session, and signs out', async () => {
    const signUpRes = await callAuth('/sign-up/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    expect(signUpRes.status).toBeLessThan(400)
    const signUpBody = (await signUpRes.json()) as { user?: { id?: string }; error?: { message?: string } }
    expect(signUpBody.error).toBeUndefined()
    expect(signUpBody.user?.id).toBeTruthy()
    userId = signUpBody.user!.id!

    const signInRes = await callAuth('/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    expect(signInRes.status).toBeLessThan(400)
    const cookie = readSetCookie(signInRes)
    expect(cookie).toContain('session')

    const sessionRes = await callAuth('/get-session', {
      method: 'GET',
      headers: { cookie },
    })
    expect(sessionRes.status).toBe(200)
    const sessionBody = (await sessionRes.json()) as { user?: { id?: string; email?: string } } | null
    expect(sessionBody?.user?.id).toBe(userId)
    expect(sessionBody?.user?.email).toBe(email)

    const signOutRes = await callAuth('/sign-out', {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(signOutRes.status).toBeLessThan(400)

    const afterOut = await callAuth('/get-session', {
      method: 'GET',
      headers: { cookie },
    })
    const afterBody = await afterOut.json()
    expect(afterBody).toBeNull()
  })
})
