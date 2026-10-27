import type { ReactNode } from 'react'
import { Body, Button, Container, Head, Html, Img, Link, Preview, Section, Text } from 'react-email'
import { getAbsoluteAssetUrl } from '../../lib/assets'
import { SITE_ORIGIN } from '../../lib/seo'
import brand from './brand-asset.json'

export const EMAIL_THEME = {
  background: '#070b0b',
  surface: '#0f1414',
  border: '#3a4a49',
  text: '#e4e9e9',
  muted: '#8fa0a0',
  accent: '#00c3ff',
  fontFamily: 'Arial, Helvetica, sans-serif',
} as const

export const TRANSACTIONAL_EMAIL_BRAND_URL = getAbsoluteAssetUrl(brand.key)
const BRAND_DISPLAY_WIDTH = 110
export const TRANSACTIONAL_EMAIL_FOOTER = {
  name: 'Moltology',
  support: 'support@moltology.org',
  privacyUrl: `${SITE_ORIGIN}/privacy`,
  termsUrl: `${SITE_ORIGIN}/terms`,
} as const

export function TransactionalBrandHeader() {
  return (
    <Section style={{ textAlign: 'center', paddingBottom: '32px' }}>
      <Link href={SITE_ORIGIN} style={{ textDecoration: 'none' }}>
        <Img src={TRANSACTIONAL_EMAIL_BRAND_URL} width={BRAND_DISPLAY_WIDTH} height={Math.round(brand.height * BRAND_DISPLAY_WIDTH / brand.width)}
          alt="Moltology — The Synaptic Path" style={{ margin: '0 auto', maxWidth: '100%', height: 'auto' }} />
      </Link>
    </Section>
  )
}

export function TransactionalButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button href={href} style={{ backgroundColor: EMAIL_THEME.accent, color: EMAIL_THEME.background,
      borderRadius: '6px', boxSizing: 'border-box', padding: '14px 24px', fontSize: '16px',
      lineHeight: '20px', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
      {children}
    </Button>
  )
}

export function TransactionalFooter() {
  const linkStyle = { color: EMAIL_THEME.muted, textDecoration: 'underline' }
  return (
    <Section style={{ borderTop: `1px solid ${EMAIL_THEME.border}`, marginTop: '28px', paddingTop: '20px', textAlign: 'center' }}>
      <Text style={{ color: EMAIL_THEME.muted, fontSize: '12px', lineHeight: '20px', margin: '0' }}>
        {TRANSACTIONAL_EMAIL_FOOTER.name}<br />
        <Link href={`mailto:${TRANSACTIONAL_EMAIL_FOOTER.support}`} style={linkStyle}>{TRANSACTIONAL_EMAIL_FOOTER.support}</Link>
        <br />
        <Link href={TRANSACTIONAL_EMAIL_FOOTER.privacyUrl} style={linkStyle}>Privacy</Link>
        {' · '}
        <Link href={TRANSACTIONAL_EMAIL_FOOTER.termsUrl} style={linkStyle}>Terms</Link>
      </Text>
    </Section>
  )
}

/** Shared shell for necessary account/service messages, with no marketing controls. */
export function TransactionalLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Body style={{ backgroundColor: EMAIL_THEME.background, color: EMAIL_THEME.text,
        margin: '0', padding: '32px 12px', fontFamily: EMAIL_THEME.fontFamily }}>
        <Preview>{preview}</Preview>
        <Container style={{ maxWidth: '480px', width: '100%', margin: '0 auto',
          backgroundColor: EMAIL_THEME.surface, border: `1px solid ${EMAIL_THEME.border}`,
          borderRadius: '8px' }}>
          <Section style={{ padding: '32px 24px' }}>
            <TransactionalBrandHeader />
            {children}
            <TransactionalFooter />
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function renderTransactionalFooterText(): string {
  return [TRANSACTIONAL_EMAIL_FOOTER.name, TRANSACTIONAL_EMAIL_FOOTER.support,
    `Privacy: ${TRANSACTIONAL_EMAIL_FOOTER.privacyUrl}`, `Terms: ${TRANSACTIONAL_EMAIL_FOOTER.termsUrl}`].join('\n')
}
