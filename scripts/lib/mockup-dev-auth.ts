/** Refuse saved credentials unless the local environment identifies a distinct development database. */
export function validateDevCapture(baseUrl: string, env: NodeJS.ProcessEnv) {
  const base = new URL(baseUrl)
  if (base.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) {
    throw new Error('--auth-dev requires an HTTP loopback development server.')
  }
  const target = (value?: string) => {
    try {
      const url = new URL(value || '')
      return ['postgres:', 'postgresql:'].includes(url.protocol)
        ? `${url.hostname.toLowerCase().replace('-pooler.', '.')}${url.pathname}` : null
    } catch { return null }
  }
  const database = target(env.DATABASE_URL)
  if (!database || !target(env.PROD_DATABASE_URL) || database !== target(env.DEV_DATABASE_URL) || database === target(env.PROD_DATABASE_URL)) {
    throw new Error('--auth-dev requires DATABASE_URL to match DEV_DATABASE_URL and differ from PROD_DATABASE_URL.')
  }
  if (!env.DEV_TEST_EMAIL || !env.DEV_TEST_PASSWORD || !env.DEV_TEST_USER_ID) {
    throw new Error('--auth-dev requires DEV_TEST_EMAIL, DEV_TEST_PASSWORD, and DEV_TEST_USER_ID.')
  }
  return { email: env.DEV_TEST_EMAIL, password: env.DEV_TEST_PASSWORD, userId: env.DEV_TEST_USER_ID }
}
