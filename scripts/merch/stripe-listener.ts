import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { MERCH_CHECKOUT_EVENT_TYPES } from '../../src/lib/merch'

/** Update only the local signing-secret entry, preserving unrelated settings. */
export function withStripeWebhookSecret(contents: string, secret: string): string {
  if (!/^whsec_[a-zA-Z0-9]+$/.test(secret)) throw new Error('Invalid Stripe webhook signing secret.')
  const line = `STRIPE_WEBHOOK_SECRET="${secret}"`
  return /^STRIPE_WEBHOOK_SECRET=.*$/m.test(contents)
    ? contents.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, line)
    : `${contents.trimEnd()}\n${line}\n`
}

/** The secret and API key never appear in shell arguments or printed output. */
export async function listenForStripe(configureOnly = false): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || !/^(sk|rk)_test_/.test(key)) throw new Error('Stripe listener requires a test key.')
  const binary = process.env.STRIPE_CLI_PATH || (fs.existsSync('tmp/merch/tools/stripe') ? path.resolve('tmp/merch/tools/stripe') : 'stripe')
  const origin = new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000')
  if (!['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)) throw new Error('Local Stripe listener requires BETTER_AUTH_URL to use localhost.')
  const args = configureOnly ? ['listen', '--print-secret'] : [
    'listen', '--forward-to', new URL('/api/stripe/webhook', origin).href,
    '--events', [...MERCH_CHECKOUT_EVENT_TYPES, 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid', 'invoice.payment_failed'].join(','),
  ]
  await new Promise<void>((resolve, reject) => {
    const child = spawn(binary, args, { env: { ...process.env, STRIPE_API_KEY: key }, stdio: ['ignore', 'pipe', 'pipe'] })
    let saved = false
    const output = (chunk: Buffer) => {
      const safe = chunk.toString().replaceAll(key, '[redacted]')
      const secret = safe.match(/whsec_[a-zA-Z0-9]+/)?.[0]
      if (secret && !saved) {
        const file = path.resolve('.env')
        const contents = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
        fs.writeFileSync(file, withStripeWebhookSecret(contents, secret), { mode: 0o600 })
        fs.chmodSync(file, 0o600)
        saved = true
        console.log('Saved Stripe test webhook secret to local .env. Restart the app if it is already running.')
      }
      if (configureOnly && safe.includes('stripecli_session_write')) console.log('Stripe key needs Debugging Tools Write (stripecli_session_write).')
      if (!configureOnly) process.stdout.write(safe.replace(/whsec_[a-zA-Z0-9]+/g, '[signing secret saved locally]'))
    }
    // Buffer complete lines so secrets split across OS chunks are still redacted.
    for (const stream of [child.stdout, child.stderr]) {
      let pending = ''
      stream.on('data', (chunk: Buffer) => {
        pending += chunk.toString()
        let index: number
        while ((index = pending.indexOf('\n')) !== -1) {
          output(Buffer.from(pending.slice(0, index + 1)))
          pending = pending.slice(index + 1)
        }
      })
      stream.on('end', () => { if (pending) output(Buffer.from(pending)) })
    }
    child.on('error', () => reject(new Error('Stripe CLI could not start. Install it or set STRIPE_CLI_PATH.')))
    child.on('close', code => code === 0 && (!configureOnly || saved) ? resolve() : reject(new Error('Stripe listener failed; verify CLI access to your test account.')))
    const interrupt = () => child.kill('SIGINT')
    process.once('SIGINT', interrupt)
    child.once('exit', () => process.removeListener('SIGINT', interrupt))
  })
}
