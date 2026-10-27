#!/usr/bin/env node
/** Generate review artifacts only. Never sends mail or creates an auth token. */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { renderEmailVerificationEmailHtml, renderEmailVerificationEmailText } from '../src/emails/email-verification'
import { renderWelcomeEmailHtml, renderWelcomeEmailText } from '../src/emails/welcome'

async function main() {
  const directory = path.resolve('tmp/email-preview')
  const url = 'https://moltology.org/api/auth/verify-email?token=preview-not-a-real-token&callbackURL=%2Fhome'
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'verification.html'), await renderEmailVerificationEmailHtml(url))
  await writeFile(path.join(directory, 'verification.txt'), renderEmailVerificationEmailText(url))
  await writeFile(path.join(directory, 'welcome.html'), await renderWelcomeEmailHtml())
  await writeFile(path.join(directory, 'welcome.txt'), renderWelcomeEmailText())
  console.log(`Dummy-link previews: ${directory}/verification.{html,txt}`)
  console.log(`Welcome previews: ${directory}/welcome.{html,txt}`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
