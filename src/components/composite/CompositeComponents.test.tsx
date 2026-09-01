import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CompositeContainer } from './CompositeContainer'
import { SocialHookSlide } from './SocialHookSlide'
import { SocialSpecShowdownSlide } from './SocialSpecShowdownSlide'
import { SocialDirectivesSlide } from './SocialDirectivesSlide'
import { ReelOutroCard } from './ReelOutroCard'
import { ReelSimpleOutroCard } from './ReelSimpleOutroCard'
import { ReelThumbnailCard } from './ReelThumbnailCard'
import { BlogSchematicCard } from './BlogSchematicCard'
import { SocialMarketingSlide } from './SocialMarketingSlide'
import { SocialPromptVaultSlide } from './SocialPromptVaultSlide'

describe('Composite UI Components', () => {
  it('renders CompositeContainer with correct dimensions and scanlines', () => {
    const { container } = render(
      <CompositeContainer aspectRatio="4:5">
        <div>Test Child</div>
      </CompositeContainer>
    )

    expect(screen.getByText('Test Child')).toBeInTheDocument()
    const frame = container.firstChild as HTMLElement
    expect(frame.style.width).toBe('1080px')
    expect(frame.style.height).toBe('1350px')
  })

  it('renders SocialHookSlide with badges, headlines, metrics, and fit-height metrics container', () => {
    const { container } = render(
      <SocialHookSlide
        categoryBadge="TEST BADGE"
        headlinePart1="PART ONE"
        headlinePart2="PART TWO"
        headlineHighlight="HIGHLIGHT"
        leftMetric={{
          label: 'METRIC A',
          value: '100 GB',
          sublabel: 'SUB A',
          variant: 'red',
        }}
        rightMetric={{
          label: 'METRIC B',
          value: '-50%',
          sublabel: 'SUB B',
          variant: 'cyan',
        }}
      />
    )

    expect(screen.getByText('TEST BADGE')).toBeInTheDocument()
    expect(screen.getByText('PART ONE')).toBeInTheDocument()
    expect(screen.getByText('PART TWO')).toBeInTheDocument()
    expect(screen.getByText('HIGHLIGHT')).toBeInTheDocument()
    expect(screen.getByText('100 GB')).toBeInTheDocument()
    expect(screen.getByText('-50%')).toBeInTheDocument()
    expect(screen.getByText('Key Architectural Metrics')).toBeInTheDocument()

    // Verify key architectural metrics container wraps text and doesn't stretch to bottom
    const metricsContainer = screen.getByText('Key Architectural Metrics').closest('.w-\\[62\\%\\]')
    expect(metricsContainer).toHaveClass('h-fit')
  })

  it('renders SocialSpecShowdownSlide with all 3 comparison cards having equal 64% width', () => {
    const { container } = render(
      <SocialSpecShowdownSlide
        headline="TEST SPEC SHOWDOWN"
        cards={[
          {
            number: '01',
            title: 'CARD ONE',
            metric: '99.9%',
            description: 'First card desc',
            variant: 'red',
          },
          {
            number: '02',
            title: 'CARD TWO',
            metric: '88.8%',
            description: 'Second card desc',
            variant: 'cyan',
          },
          {
            number: '03',
            title: 'CARD THREE',
            metric: '77.7%',
            description: 'Third card desc',
            variant: 'sky',
          },
        ]}
      />
    )

    expect(screen.getByText('TEST SPEC SHOWDOWN')).toBeInTheDocument()
    expect(screen.getByText('CARD ONE')).toBeInTheDocument()
    expect(screen.getByText('CARD TWO')).toBeInTheDocument()
    expect(screen.getByText('CARD THREE')).toBeInTheDocument()

    // Verify all 3 cards have w-[64%]
    const card1 = screen.getByText('CARD ONE').closest('.w-\\[64\\%\\]')
    const card2 = screen.getByText('CARD TWO').closest('.w-\\[64\\%\\]')
    const card3 = screen.getByText('CARD THREE').closest('.w-\\[64\\%\\]')
    expect(card1).toBeInTheDocument()
    expect(card2).toBeInTheDocument()
    expect(card3).toBeInTheDocument()
    expect(card1).toHaveClass('w-[64%]')
    expect(card2).toHaveClass('w-[64%]')
    expect(card3).toHaveClass('w-[64%]')
  })

  it('renders SocialDirectivesSlide with fit-height CTA card', () => {
    render(
      <SocialDirectivesSlide
        headlinePart1="DIRECTIVE TITLE"
        headlinePart2="SUBTITLE"
        ctaHeader="READ THE FULL DISPATCH"
        ctaButtonText="VISIT MOLTOLOGY"
      />
    )

    expect(screen.getByText('DIRECTIVE TITLE')).toBeInTheDocument()
    expect(screen.getByText('SUBTITLE')).toBeInTheDocument()
    expect(screen.getByText('READ THE FULL DISPATCH')).toBeInTheDocument()
    expect(screen.getByText('VISIT MOLTOLOGY')).toBeInTheDocument()

    // Verify CTA card has h-fit and w-[66%]
    const ctaCard = screen.getByText('READ THE FULL DISPATCH').closest('.w-\\[66\\%\\]')
    expect(ctaCard).toBeInTheDocument()
    expect(ctaCard).toHaveClass('h-fit')
    expect(ctaCard).toHaveClass('w-[66%]')
  })

  it('renders ReelOutroCard with brand emblem, headline, CTA button, and removes zero latency telemetry and tap to audit', () => {
    render(
      <ReelOutroCard
        headline="ASCEND NOW"
        subheadline="CALCULATE CLEARANCE"
        url="moltology.org"
        actionBadgeText="⚡ TAKE THE 15-STAGE MOLTMAXXING TEST"
        linkInBioText="LINK IN BIO"
      />
    )

    expect(screen.getByText('Moltology')).toBeInTheDocument()
    expect(screen.getByText('THE SYNAPTIC PATH')).toBeInTheDocument()
    expect(screen.getByText('ASCEND NOW')).toBeInTheDocument()
    expect(screen.getByText('CALCULATE CLEARANCE')).toBeInTheDocument()
    expect(screen.getByText('moltology.org')).toBeInTheDocument()
    expect(screen.getByText('⚡ TAKE THE 15-STAGE MOLTMAXXING TEST')).toBeInTheDocument()
    expect(screen.getByText('LINK IN BIO')).toBeInTheDocument()
    expect(screen.queryByText(/TAP TO AUDIT/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ZERO LATENCY TELEMETRY/i)).not.toBeInTheDocument()
  })

  it('renders ReelSimpleOutroCard with minimalist brand emblem, Moltology title, Synaptic Path row, and clean moltology.org CTA', () => {
    render(
      <ReelSimpleOutroCard
        url="moltology.org"
      />
    )

    expect(screen.getByAltText('Moltology Order Emblem')).toBeInTheDocument()
    expect(screen.getByText('Moltology')).toBeInTheDocument()
    expect(screen.getByText('THE SYNAPTIC PATH')).toBeInTheDocument()
    expect(screen.getByText('moltology.org')).toBeInTheDocument()

    // Verify extraneous elements from full outro are absent
    expect(screen.queryByText('SUBMIT. SHED. ASCEND.')).not.toBeInTheDocument()
    expect(screen.queryByText(/CALCULATE YOUR MOLT CLEARANCE/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/TAKE THE 15-STAGE/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/LINK IN BIO/i)).not.toBeInTheDocument()
  })

  it('renders ReelThumbnailCard with 1:1 safe-zone center hook', () => {
    render(
      <ReelThumbnailCard
        headline="WHY COMPUTE WENT SUBSEA"
        categoryBadge="DISPATCH"
      />
    )

    expect(screen.getByText('MOLTNATION TELEMETRY')).toBeInTheDocument()
    expect(screen.getByText('DISPATCH')).toBeInTheDocument()
    expect(screen.getByText('WHY COMPUTE WENT SUBSEA')).toBeInTheDocument()
  })

  it('renders BlogSchematicCard with 16:9 layout and telemetry boxes', () => {
    render(
      <BlogSchematicCard
        categoryBadge="SUB-BENTHIC POD"
        headline="LATENT ATTENTION SCHEMATIC"
      />
    )

    expect(screen.getByText('SUB-BENTHIC POD')).toBeInTheDocument()
    expect(screen.getByText('LATENT ATTENTION SCHEMATIC')).toBeInTheDocument()
  })

  it('renders SocialMarketingSlide with 3D book mockup, benefit items, and comment CTA banner', () => {
    const { container } = render(
      <SocialMarketingSlide
        theme="moltmaxxing-guide"
        commentKeyword="GUIDE"
        bookTitle="MOLTMAXXING"
        trustBadgeText="OFFICIAL 2026 EDITION"
      />
    )

    expect(screen.getByText('STOP MELTING.')).toBeInTheDocument()
    expect(screen.getByText('CALCIFY YOUR GRIP.')).toBeInTheDocument()
    expect(screen.getByText('ASCEND FASTER!')).toBeInTheDocument()
    expect(screen.getByText('"GUIDE"')).toBeInTheDocument()
    expect(screen.getByText('SHELL HARDNESS')).toBeInTheDocument()
    expect(screen.getByText('800 NM PINCER TORQUE')).toBeInTheDocument()
    expect(screen.getByText('OFFICIAL 2026 EDITION')).toBeInTheDocument()

    // Verify chevrons >>>>>> are removed
    expect(screen.queryByText('>>>>>>')).not.toBeInTheDocument()

    // Verify no pulsing or pinging animations exist in marketing slide
    expect(container.querySelector('.animate-pulse')).toBeNull()
    expect(container.querySelector('.animate-ping')).toBeNull()

    // Verify mascot is positioned at top-right
    const mascotWrapper = container.querySelector('[data-mascot-key="lobster_thumbs_up"]')
    expect(mascotWrapper).toBeInTheDocument()
    expect(mascotWrapper?.className).toContain('top-2')
    expect(mascotWrapper?.className).toContain('right-0')
  })

  it('renders SocialPromptVaultSlide with 3D typography, prompt cards, footer telemetry nodes, and comment CTA banner', () => {
    const { container } = render(
      <SocialPromptVaultSlide
        theme="oracle-prompts"
        eyebrowBadge="TEST VAULT · SYNAPTIC DIRECTIVES"
        heroNumber="250+"
        heroHighlight="ORACLE"
        heroSubject="PROMPTS"
        heroSubPill="For Deep Focus & Ascension"
        commentKeyword="PROMPTS"
        mascot="lobster_pointing"
        promptCards={[
          {
            icon: 'chat',
            badge: 'ORACLE PROMPT',
            prompt: 'Audit my open task latency and calculate my Stage 2 ecdysis schedule.',
          },
          {
            icon: 'search',
            badge: 'ORACLE PROMPT',
            prompt: 'Formulate a 24-hour isometric pincer routine to eliminate surface distraction.',
          },
        ]}
        footerNodes={[
          { icon: 'lightbulb', label: 'ECDYSIS PROTOCOLS' },
          { icon: 'search', label: 'LATENCY AUDIT' },
          { icon: 'workflow', label: '50K FATHOMS FLOW' },
          { icon: 'document', label: 'CODEX LITURGIES' },
        ]}
      />
    )

    expect(screen.getByText('TEST VAULT · SYNAPTIC DIRECTIVES')).toBeInTheDocument()
    expect(screen.getByText('250+')).toBeInTheDocument()
    expect(screen.getAllByText('ORACLE').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('PROMPTS')).toBeInTheDocument()
    expect(screen.getByText('For Deep Focus & Ascension')).toBeInTheDocument()
    expect(screen.getByText('"PROMPTS"')).toBeInTheDocument()
    expect(screen.getByText(/Audit my open task latency/i)).toBeInTheDocument()
    expect(screen.getByText(/Formulate a 24-hour isometric pincer routine/i)).toBeInTheDocument()
    expect(screen.getByText('ECDYSIS PROTOCOLS')).toBeInTheDocument()
    expect(screen.getByText('LATENCY AUDIT')).toBeInTheDocument()
    expect(screen.getByText('50K FATHOMS FLOW')).toBeInTheDocument()
    expect(screen.getByText('CODEX LITURGIES')).toBeInTheDocument()

    // Verify mascot is rendered
    const mascotWrapper = container.querySelector('[data-mascot-key="lobster_pointing"]')
    expect(mascotWrapper).toBeInTheDocument()
  })

  it('renders ThreeBookCover canvas element with dimensions and custom props', async () => {
    const { ThreeBookCover } = await import('./ThreeBookCover')
    const { container } = render(
      <ThreeBookCover
        width={420}
        height={540}
        coverTitlePart1="MOLT"
        coverTitlePart2="MAXXING"
        coverSubtitle="ADVANCED PROTOCOL"
        coverTagline="TORQUE · CLARITY"
        themeVariant="cyan"
      />
    )

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas?.getAttribute('width')).toBe('420')
    expect(canvas?.getAttribute('height')).toBe('540')
  })

  it('correctly normalizes mascot keys and aliases in getMascotInfo', async () => {
    const { normalizeMascotKey, getMascotInfo, MASCOT_REGISTRY } = await import('./MascotOverlay')

    expect(normalizeMascotKey('pointing')).toBe('lobster_pointing')
    expect(normalizeMascotKey('lobster_pointing_cta')).toBe('lobster_pointing')
    expect(normalizeMascotKey('char_lobster_speed_action.png')).toBe('lobster_action')
    expect(normalizeMascotKey('stats')).toBe('crab_stats')
    expect(normalizeMascotKey('peek')).toBe('lobster_peek')
    expect(normalizeMascotKey('peaceful')).toBe('lobster_peaceful')
    expect(normalizeMascotKey('engineer')).toBe('lobster_engineer')
    expect(normalizeMascotKey('thumbs_up')).toBe('lobster_thumbs_up')

    // Verify all 7 registry items have valid Neon S3 CDN URLs
    expect(Object.keys(MASCOT_REGISTRY).length).toBe(7)
    for (const key of Object.keys(MASCOT_REGISTRY)) {
      const info = getMascotInfo(key)
      expect(info.s3Url).toContain('moltology-public-assets/images/characters/')
      expect(info.filename).toMatch(/\.(webp|png)$/)
    }
  })

  it('renders MascotOverlay with image and fallback capabilities', async () => {
    const { MascotOverlay } = await import('./MascotOverlay')
    const { container } = render(
      <MascotOverlay mascot="lobster_pointing" width={300} />
    )

    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img?.getAttribute('src')).toContain('char_lobster_pointing_cta.webp')
    expect(img?.getAttribute('loading')).toBe('eager')
  })

  it('renders CompositeStudioUI in full-height layout with zoom controls and scrolling sidebar', async () => {
    const { CompositeStudioUI } = await import('./CompositeStudioUI')
    const { container } = render(<CompositeStudioUI />)

    // Check header & app title
    expect(screen.getByText('Composite Studio')).toBeInTheDocument()
    expect(screen.getByText('ADMIN ENGINE')).toBeInTheDocument()

    // Check full-height layout classes
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('h-screen')
    expect(root.className).toContain('overflow-hidden')

    // Check zoom controls
    expect(screen.getByTitle('Zoom In (+5%)')).toBeInTheDocument()
    expect(screen.getByTitle('Zoom Out (-5%)')).toBeInTheDocument()
    expect(screen.getByTitle('Fit to Screen')).toBeInTheDocument()
    expect(screen.getByTitle('100% Native Resolution')).toBeInTheDocument()
  })
})
