import { afterAll, describe, expect, it } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../db'
import { authAccount, authSession, authUser, profiles, userStats } from '../db/schema'
import { auth } from './auth-server'

const dummyUrl =
  typeof process !== 'undefined' &&
  (process.env.DATABASE_URL || '').includes('ep-dummy')

function readSetCookieLines(response: Response): string[] {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] }
  const many = headers.getSetCookie?.() ?? []
  if (many.length > 0) return many
  const single = response.headers.get('set-cookie')
  return single ? [single] : []
}

function applySetCookie(jar: Map<string, string>, response: Response): void {
  // Browser cookie jar: honor sign-out Max-Age=0 so session_data cannot outlive logout.
  for (const raw of readSetCookieLines(response)) {
    const [pair, ...attrs] = raw.split(';')
    const eq = pair.indexOf('=')
    if (eq < 0) continue
    const name = pair.slice(0, eq).trim()
    const value = pair.slice(eq + 1).trim()
    const attrStr = attrs.join(';').toLowerCase()
    const expired =
      !value ||
      /max-age=0/.test(attrStr) ||
      /expires=thu,\s*01 jan 1970/.test(attrStr)
    if (expired) jar.delete(name)
    else jar.set(name, value)
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
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

    const cookies = new Map<string, string>()

    const signInRes = await callAuth('/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    expect(signInRes.status).toBeLessThan(400)
    applySetCookie(cookies, signInRes)
    expect(cookieHeader(cookies)).toContain('session')

    const sessionRes = await callAuth('/get-session', {
      method: 'GET',
      headers: { cookie: cookieHeader(cookies) },
    })
    expect(sessionRes.status).toBe(200)
    applySetCookie(cookies, sessionRes)
    const sessionBody = (await sessionRes.json()) as { user?: { id?: string; email?: string } } | null
    expect(sessionBody?.user?.id).toBe(userId)
    expect(sessionBody?.user?.email).toBe(email)

    const signOutRes = await callAuth('/sign-out', {
      method: 'POST',
      headers: { cookie: cookieHeader(cookies), 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(signOutRes.status).toBeLessThan(400)
    applySetCookie(cookies, signOutRes)

    const afterOut = await callAuth('/get-session', {
      method: 'GET',
      headers: { cookie: cookieHeader(cookies) },
    })
    const afterBody = await afterOut.json()
    expect(afterBody).toBeNull()
  })
})
