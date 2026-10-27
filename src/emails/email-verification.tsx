import { render } from '@react-email/render'
import { Heading, Link, Section, Text } from 'react-email'
import { EMAIL_VERIFICATION_EXPIRES_IN_SECONDS } from '../lib/auth-config'
import { getAbsoluteAssetUrl } from '../lib/assets'
import {
  EMAIL_THEME,
  TransactionalButton,
  TransactionalLayout,
  renderTransactionalFooterText,
} from './components/transactional'

export const EMAIL_VERIFICATION_MAIL = {
  subject: 'Verify your email for Moltology',
  preview: 'Confirm your email to finish creating your account.',
  heading: 'Verify your email',
  body: 'Confirm your email address to finish creating your Moltology\u00a0account.',
  button: 'Verify email',
  expiration: `This link expires in ${EMAIL_VERIFICATION_EXPIRES_IN_SECONDS / 3600} hour.`,
  fallback: 'If the button doesn’t work, copy and paste this link into your browser.',
  ignore: 'If you didn’t create a Moltology\u00a0account, you can ignore this email.',
} as const

// Kept for existing consumers; the shared header now includes the full brand lockup.
export const EMAIL_VERIFICATION_EMBLEM_URL = getAbsoluteAssetUrl('/images/order_emblem.png')

export interface EmailVerificationEmailProps {
  url: string
}

export function EmailVerificationEmail({ url }: EmailVerificationEmailProps) {
  return (
    <TransactionalLayout preview={EMAIL_VERIFICATION_MAIL.preview}>
      <Heading as="h1" style={{ color: EMAIL_THEME.text, fontSize: '24px', lineHeight: '32px',
        fontWeight: 600, textAlign: 'center', margin: '0 0 16px' }}>
        {EMAIL_VERIFICATION_MAIL.heading}
      </Heading>
      <Text style={{ color: EMAIL_THEME.text, fontSize: '16px', lineHeight: '24px', textAlign: 'center', margin: '0' }}>
        {EMAIL_VERIFICATION_MAIL.body}
      </Text>
      <Section style={{ textAlign: 'center', marginTop: '24px', marginBottom: '16px' }}>
        <TransactionalButton href={url}>{EMAIL_VERIFICATION_MAIL.button}</TransactionalButton>
      </Section>
      <Text style={{ color: EMAIL_THEME.muted, fontSize: '14px', lineHeight: '22px', textAlign: 'center', margin: '0 0 24px' }}>
        {EMAIL_VERIFICATION_MAIL.expiration}
      </Text>
      <Text style={{ color: EMAIL_THEME.muted, fontSize: '14px', lineHeight: '22px', margin: '0 0 16px' }}>
        {EMAIL_VERIFICATION_MAIL.fallback}<br />
        <Link href={url} style={{ color: EMAIL_THEME.accent, textDecoration: 'underline', wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{url}</Link>
      </Text>
      <Text style={{ color: EMAIL_THEME.muted, fontSize: '14px', lineHeight: '22px', margin: '0' }}>
        {EMAIL_VERIFICATION_MAIL.ignore}
      </Text>
    </TransactionalLayout>
  )
}

EmailVerificationEmail.PreviewProps = {
  url: 'https://moltology.org/api/auth/verify-email?token=preview',
} satisfies EmailVerificationEmailProps

export default EmailVerificationEmail

export async function renderEmailVerificationEmailHtml(url: string): Promise<string> {
  return render(<EmailVerificationEmail url={url} />)
}

/** Independent of HTML rendering so a render failure still allows text delivery. */
export function renderEmailVerificationEmailText(url: string): string {
  return ['Moltology — The Synaptic Path', '', EMAIL_VERIFICATION_MAIL.heading, '',
    EMAIL_VERIFICATION_MAIL.body, '', `${EMAIL_VERIFICATION_MAIL.button}: ${url}`, '',
    EMAIL_VERIFICATION_MAIL.expiration, '', EMAIL_VERIFICATION_MAIL.fallback, url, '',
    EMAIL_VERIFICATION_MAIL.ignore, '', renderTransactionalFooterText()].join('\n')
}
