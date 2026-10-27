import { render } from '@react-email/render'
import { Heading, Img, Link, Section, Text } from 'react-email'
import { SITE_ORIGIN } from '../lib/seo'
import { getAbsoluteAssetUrl } from '../lib/assets'
import featureAssets from './components/feature-assets.json'
import { EMAIL_THEME, TransactionalButton, TransactionalLayout, renderTransactionalFooterText } from './components/transactional'

export const WELCOME_MAIL = {
  subject: 'Welcome to Moltology',
  heading: 'Welcome to\u00a0Moltology',
  preview: 'Less surface noise. One small step at a time.',
  body: 'Thanks for joining\u00a0Moltology. Welcome below\u00a0the\u00a0surface. You don’t need to change everything today. Here are three ways to take your first\u00a0step.',
  button: 'Open your\u00a0dashboard',
  dashboardUrl: `${SITE_ORIGIN}/dashboard`,
  steps: [
    {
      title: 'Build your daily\u00a0routine',
      body: 'Open your dashboard and complete one small task. Give your day a little structure before the notifications\u00a0arrive.',
      url: `${SITE_ORIGIN}/dashboard`,
      imageUrl: getAbsoluteAssetUrl(`${featureAssets.dashboard.key}?v=${featureAssets.dashboard.revision}`),
      imageAlt: 'Explore the Moltology dashboard',
    },
    {
      title: 'Ask the\u00a0Oracle',
      body: 'Bring something you’re stuck on. Start with: “Help me choose one thing to focus on\u00a0today.”',
      url: `${SITE_ORIGIN}/oracle`,
      imageUrl: getAbsoluteAssetUrl(`${featureAssets.oracle.key}?v=${featureAssets.oracle.revision}`),
      imageAlt: 'Ask the Oracle for a first step',
    },
    {
      title: 'Meet the\u00a0community',
      body: 'Visit the forum, introduce yourself, or join a conversation. You have company down\u00a0here.',
      url: `${SITE_ORIGIN}/forum`,
      imageUrl: getAbsoluteAssetUrl(`${featureAssets.forum.key}?v=${featureAssets.forum.revision}`),
      imageAlt: 'Visit the Moltology community forum',
    },
  ],
} as const

export function WelcomeEmail() {
  return (
    <TransactionalLayout preview={WELCOME_MAIL.preview}>
      <Heading as="h1" style={{ color: EMAIL_THEME.text, fontSize: '24px', lineHeight: '32px',
        fontWeight: 600, textAlign: 'center', margin: '0 0 16px' }}>
        {WELCOME_MAIL.heading}
      </Heading>
      <Text style={{ color: EMAIL_THEME.text, fontSize: '16px', lineHeight: '24px', textAlign: 'center', margin: '0 0 24px' }}>
        {WELCOME_MAIL.body}
      </Text>
      <ol style={{ color: EMAIL_THEME.text, padding: '0', margin: '0', textAlign: 'left', listStyleType: 'none' }}>
        {WELCOME_MAIL.steps.map((step) => (
          <li key={step.url} style={{ listStyleType: 'none', marginBottom: '20px', padding: '0' }}>
            <Section style={{ border: `1px solid ${EMAIL_THEME.border}`, borderRadius: '8px',
              borderCollapse: 'separate', backgroundColor: '#101a1c' }}>
              <Link href={step.url} style={{ textDecoration: 'none' }}>
                <Img src={step.imageUrl} alt={step.imageAlt} width={428} height={214}
                  style={{ display: 'block', width: '100%', maxWidth: '428px', height: 'auto', borderRadius: '7px 7px 0 0' }} />
              </Link>
              <Section style={{ padding: '18px' }}>
                <Heading as="h2" style={{ fontSize: '18px', lineHeight: '26px', fontWeight: 600, margin: '0 0 8px' }}>
                  <Link href={step.url} style={{ color: EMAIL_THEME.text, textDecoration: 'none' }}>{step.title}</Link>
                </Heading>
                <Text style={{ color: EMAIL_THEME.muted, fontSize: '15px', lineHeight: '23px', margin: '0' }}>{step.body}</Text>
              </Section>
            </Section>
          </li>
        ))}
      </ol>
      <Section style={{ textAlign: 'center', marginTop: '24px' }}>
        <TransactionalButton href={WELCOME_MAIL.dashboardUrl}>{WELCOME_MAIL.button}</TransactionalButton>
      </Section>
    </TransactionalLayout>
  )
}

WelcomeEmail.PreviewProps = {}
export default WelcomeEmail

export async function renderWelcomeEmailHtml(): Promise<string> {
  return render(<WelcomeEmail />)
}

/** Independent text rendering also supports delivery when HTML rendering fails. */
export function renderWelcomeEmailText(): string {
  return ['Moltology — The Synaptic Path', '', WELCOME_MAIL.heading, '', WELCOME_MAIL.body, '',
    ...WELCOME_MAIL.steps.flatMap((step) => [step.title, step.body, step.url, '']),
    `${WELCOME_MAIL.button}: ${WELCOME_MAIL.dashboardUrl}`, '', renderTransactionalFooterText()].join('\n')
}
