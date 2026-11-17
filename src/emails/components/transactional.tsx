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
export const TRANSACTIONAL_EMAIL_FOOTER_LOCKUP_URL = getAbsoluteAssetUrl(brand.footerLockup.key)
export const TRANSACTIONAL_EMAIL_FOOTER = {
  name: 'Moltology',
  support: 'support@moltology.org',
  privacyUrl: `${SITE_ORIGIN}/privacy`,
  termsUrl: `${SITE_ORIGIN}/terms`,
  youtubeUrl: 'https://www.youtube.com/@Moltology',
  instagramUrl: 'https://www.instagram.com/moltology_org/',
} as const

export const TRANSACTIONAL_EMAIL_SOCIAL = {
  youtube: {
    label: 'YouTube',
    url: TRANSACTIONAL_EMAIL_FOOTER.youtubeUrl,
    iconUrl: getAbsoluteAssetUrl(brand.social.youtube.key),
    width: brand.social.youtube.width,
    height: brand.social.youtube.height,
  },
  instagram: {
    label: 'Instagram',
    url: TRANSACTIONAL_EMAIL_FOOTER.instagramUrl,
    iconUrl: getAbsoluteAssetUrl(brand.social.instagram.key),
    width: brand.social.instagram.width,
    height: brand.social.instagram.height,
  },
} as const

export function TransactionalBrandHeader() {
  return (
    <Section className="molt-email-header" style={{ textAlign: 'center', paddingBottom: '24px' }}>
      <Link href={SITE_ORIGIN} style={{ textDecoration: 'none', display: 'inline-block' }}>
        <Img
          src={TRANSACTIONAL_EMAIL_BRAND_URL}
          width={brand.width}
          height={brand.height}
          alt="Moltology"
          style={{ display: 'block', margin: '0 auto', maxWidth: '100%', height: 'auto' }}
        />
      </Link>
    </Section>
  )
}

export function TransactionalButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button className="molt-email-cta" href={href} style={{ backgroundColor: EMAIL_THEME.accent, color: EMAIL_THEME.background,
      borderRadius: '6px', boxSizing: 'border-box', padding: '14px 24px', fontSize: '16px',
      lineHeight: '20px', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
      {children}
    </Button>
  )
}

export function TransactionalFooter() {
  const linkStyle = { color: EMAIL_THEME.muted, textDecoration: 'underline' }
  return (
    <Section className="molt-email-footer" style={{ borderTop: `1px solid ${EMAIL_THEME.border}`, marginTop: '28px', paddingTop: '20px' }}>
      <table width="100%" border={0} cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <tr>
            <td align="left" valign="middle">
              <Link href={SITE_ORIGIN} style={{ color: EMAIL_THEME.muted, textDecoration: 'none', display: 'inline-block' }}>
                <Img
                  className="molt-email-footer-lockup"
                  src={TRANSACTIONAL_EMAIL_FOOTER_LOCKUP_URL}
                  width={brand.footerLockup.width}
                  height={brand.footerLockup.height}
                  alt="Moltology — The Synaptic Path"
                  style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                />
              </Link>
            </td>
            <td align="right" valign="middle" style={{ whiteSpace: 'nowrap', paddingLeft: '12px' }}>
              <table border={0} cellPadding={0} cellSpacing={0} role="presentation" style={{ display: 'inline-table' }}>
                <tbody>
                  <tr>
                    <td valign="middle" style={{ paddingRight: '4px' }}>
                      <Link
                        href={TRANSACTIONAL_EMAIL_SOCIAL.youtube.url}
                        aria-label="Moltology on YouTube"
                        style={{ color: EMAIL_THEME.muted, textDecoration: 'none', display: 'inline-block', padding: '6px' }}
                      >
                        <Img
                          src={TRANSACTIONAL_EMAIL_SOCIAL.youtube.iconUrl}
                          width={TRANSACTIONAL_EMAIL_SOCIAL.youtube.width}
                          height={TRANSACTIONAL_EMAIL_SOCIAL.youtube.height}
                          alt="YouTube"
                          style={{ display: 'block' }}
                        />
                      </Link>
                    </td>
                    <td valign="middle">
                      <Link
                        href={TRANSACTIONAL_EMAIL_SOCIAL.instagram.url}
                        aria-label="Moltology on Instagram"
                        style={{ color: EMAIL_THEME.muted, textDecoration: 'none', display: 'inline-block', padding: '6px 0 6px 6px' }}
                      >
                        <Img
                          src={TRANSACTIONAL_EMAIL_SOCIAL.instagram.iconUrl}
                          width={TRANSACTIONAL_EMAIL_SOCIAL.instagram.width}
                          height={TRANSACTIONAL_EMAIL_SOCIAL.instagram.height}
                          alt="Instagram"
                          style={{ display: 'block' }}
                        />
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      <Text style={{ color: EMAIL_THEME.muted, fontSize: '12px', lineHeight: '20px', margin: '12px 0 0', textAlign: 'left' }}>
        <Link href={`mailto:${TRANSACTIONAL_EMAIL_FOOTER.support}`} style={linkStyle}>{TRANSACTIONAL_EMAIL_FOOTER.support}</Link>
        {' · '}
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
        <style>{`
          @media only screen and (max-width: 480px) {
            .molt-email-body > table > tbody > tr > td {
              padding: 12px 6px !important;
            }
            .molt-email-shell > tbody > tr > td {
              padding: 22px 16px !important;
            }
            .molt-email-header > tbody > tr > td {
              padding-bottom: 18px !important;
            }
            .molt-email-lead {
              margin-bottom: 20px !important;
            }
            .molt-email-step {
              margin-bottom: 16px !important;
            }
            .molt-email-card-body > tbody > tr > td {
              padding: 14px 16px !important;
            }
            .molt-email-cta-wrap {
              margin-top: 20px !important;
            }
            .molt-email-cta {
              display: block !important;
              width: 100% !important;
              padding: 14px 16px !important;
            }
            .molt-email-footer {
              margin-top: 22px !important;
            }
            .molt-email-footer > tbody > tr > td {
              padding-top: 16px !important;
            }
          }
        `}</style>
      </Head>
      <Body className="molt-email-body" style={{ backgroundColor: EMAIL_THEME.background, color: EMAIL_THEME.text,
        margin: '0', padding: '32px 12px', fontFamily: EMAIL_THEME.fontFamily }}>
        <Preview>{preview}</Preview>
        <Container style={{ maxWidth: '480px', width: '100%', margin: '0 auto',
          backgroundColor: EMAIL_THEME.surface, border: `1px solid ${EMAIL_THEME.border}`,
          borderRadius: '8px' }}>
          <Section className="molt-email-shell" style={{ padding: '32px 24px' }}>
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
  return [
    TRANSACTIONAL_EMAIL_FOOTER.name,
    TRANSACTIONAL_EMAIL_FOOTER.support,
    `Privacy: ${TRANSACTIONAL_EMAIL_FOOTER.privacyUrl}`,
    `Terms: ${TRANSACTIONAL_EMAIL_FOOTER.termsUrl}`,
    `YouTube: ${TRANSACTIONAL_EMAIL_FOOTER.youtubeUrl}`,
    `Instagram: ${TRANSACTIONAL_EMAIL_FOOTER.instagramUrl}`,
  ].join('\n')
}
