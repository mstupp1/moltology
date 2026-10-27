import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { PrivacyPolicyPage } from './PrivacyPolicyPage'

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }))
vi.mock('@/components/PublicHeader', () => ({ PublicHeader: () => null }))
vi.mock('@/components/MainFooter', () => ({ MainFooter: () => null }))

describe('PrivacyPolicyPage', () => {
  it('includes Google disclosures and actionable controls in server-rendered HTML', () => {
    const html = renderToStaticMarkup(<PrivacyPolicyPage />)

    expect(html).toContain('Google sign-in and Google user data')
    expect(html).toContain('openid, email, and profile')
    expect(html).toContain('Retention and deletion')
    expect(html).toContain('mailto:support@moltology.org')
    expect(html).toContain('https://myaccount.google.com/connections')
    expect(html).toContain('https://developers.google.com/terms/api-services-user-data-policy')
  })
})
