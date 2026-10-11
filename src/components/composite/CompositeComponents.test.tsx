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

  it('renders SocialHookSlide in the brand look: sentence-case headline, metrics, lockup', () => {
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

    expect(screen.getByText('Test badge')).toBeInTheDocument()
    expect(screen.getByText('Part one')).toBeInTheDocument()
    expect(screen.getByText('part two')).toBeInTheDocument()
    expect(screen.getByText('highlight')).toHaveClass('text-crimson-aggro')
    expect(screen.getByText('100 GB')).toBeInTheDocument()
    expect(screen.getByText('-50%')).toBeInTheDocument()
    expect(screen.getByText('Key takeaways')).toBeInTheDocument()
    expect(screen.getByText('Moltology')).toBeInTheDocument()
    expect(container.querySelector('.animate-pulse')).toBeNull()
  })

  it('renders SocialSpecShowdownSlide with three cards beside the mascot', () => {
    render(
      <SocialSpecShowdownSlide
        headline="TEST SPEC SHOWDOWN"
        cards={[
          { number: '01', title: 'CARD ONE', metric: '99.9%', description: 'First card desc', variant: 'red' },
          { number: '02', title: 'CARD TWO', metric: '88.8%', description: 'Second card desc', variant: 'cyan' },
          { number: '03', title: 'CARD THREE', metric: '77.7%', description: 'Third card desc', variant: 'sky' },
        ]}
      />
    )

    expect(screen.getByText('Test spec showdown')).toBeInTheDocument()
    for (const title of ['Card one', 'Card two', 'Card three']) {
      expect(screen.getByText(title).closest('.w-\\[66\\%\\]')).toBeInTheDocument()
    }
  })

  it('renders SocialDirectivesSlide with the cyan CTA', () => {
    render(
      <SocialDirectivesSlide
        headlinePart1="DIRECTIVE TITLE"
        headlinePart2="SUBTITLE"
        ctaHeader="READ THE FULL DISPATCH"
        ctaButtonText="VISIT MOLTOLOGY"
      />
    )

    expect(screen.getByText('Directive title')).toBeInTheDocument()
    expect(screen.getByText('subtitle')).toBeInTheDocument()
    expect(screen.getByText('Read the full dispatch')).toBeInTheDocument()
    expect(screen.getByText('Visit Moltology').closest('.hud-cut')).toHaveClass('bg-cyan-glow')
  })

  it('renders ReelOutroCard with the lockup, headline and CTA, without the old telemetry lines', () => {
    render(
      <ReelOutroCard
        headline="ASCEND NOW"
        subheadline="CALCULATE CLEARANCE"
        url="moltology.org"
        actionBadgeText="⚡ TAKE THE 15-STAGE MOLTMAXXING TEST"
        linkInBioText="LINK IN BIO · TAP TO AUDIT"
      />
    )

    expect(screen.getByText('Moltology')).toBeInTheDocument()
    expect(screen.getByText('Ascend now')).toBeInTheDocument()
    expect(screen.getByText('Calculate clearance')).toBeInTheDocument()
    expect(screen.getByText('moltology.org')).toBeInTheDocument()
    expect(screen.getByText('Take the 15-stage Moltmaxxing test')).toBeInTheDocument()
    expect(screen.getByText('LINK IN BIO')).toBeInTheDocument()
    expect(screen.queryByText(/TAP TO AUDIT/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/⚡/)).not.toBeInTheDocument()
  })

  it('renders ReelSimpleOutroCard with only the lockup and the moltology.org CTA', () => {
    render(<ReelSimpleOutroCard url="moltology.org" />)

    expect(screen.getByText('Moltology')).toBeInTheDocument()
    expect(screen.getByText('moltology.org')).toBeInTheDocument()
    expect(screen.queryByText(/Submit\. Shed\. Ascend\./i)).not.toBeInTheDocument()
    expect(screen.queryByText(/LINK IN BIO/i)).not.toBeInTheDocument()
  })

  it('renders ReelThumbnailCard with the hook centred in the grid-safe area', () => {
    render(<ReelThumbnailCard headline="WHY COMPUTE WENT SUBSEA" categoryBadge="DISPATCH" />)

    expect(screen.getByText('Moltology')).toBeInTheDocument()
    expect(screen.getByText('Dispatch')).toBeInTheDocument()
    expect(screen.getByText('Why compute went subsea')).toBeInTheDocument()
    expect(screen.queryByText('MOLTNATION TELEMETRY')).not.toBeInTheDocument()
  })

  it('renders BlogSchematicCard with 16:9 layout and two panels', () => {
    render(<BlogSchematicCard categoryBadge="SUB-BENTHIC POD" headline="LATENT ATTENTION SCHEMATIC" />)

    expect(screen.getByText('SUB-BENTHIC POD')).toBeInTheDocument()
    expect(screen.getByText('Latent attention schematic')).toBeInTheDocument()
  })

  it('renders SocialMarketingSlide with benefit cards, trust badge and comment CTA', () => {
    const { container } = render(
      <SocialMarketingSlide
        theme="moltmaxxing-guide"
        commentKeyword="GUIDE"
        bookTitle="MOLTMAXXING"
        trustBadgeText="OFFICIAL 2026 EDITION"
      />
    )

    expect(screen.getByText('Stop melting.')).toBeInTheDocument()
    expect(screen.getByText('Calcify your grip.')).toBeInTheDocument()
    expect(screen.getByText('Ascend faster!')).toBeInTheDocument()
    expect(screen.getByText(/Comment “GUIDE” below/)).toBeInTheDocument()
    expect(screen.getByText('Shell hardness')).toBeInTheDocument()
    expect(screen.getByText('800 NM pincer torque')).toBeInTheDocument()
    expect(screen.getByText('Official 2026 edition')).toBeInTheDocument()
    expect(screen.queryByText(/👉|👈|🔗/)).not.toBeInTheDocument()
    expect(container.querySelector('.animate-pulse')).toBeNull()
    expect(container.querySelector('.animate-ping')).toBeNull()

    const mascotWrapper = container.querySelector('[data-mascot-key="lobster_thumbs_up"]')
    expect(mascotWrapper?.className).toContain('top-8')
    expect(mascotWrapper?.className).toContain('right-8')
  })

  it('renders SocialPromptVaultSlide with the hero number, prompt cards, topic chips and comment CTA', () => {
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
          { icon: 'chat', badge: 'ORACLE PROMPT', prompt: 'Audit my open task latency and calculate my Stage 2 ecdysis schedule.' },
          { icon: 'search', badge: 'ORACLE PROMPT', prompt: 'Formulate a 24-hour isometric pincer routine to eliminate surface distraction.' },
        ]}
        footerNodes={[
          { icon: 'lightbulb', label: 'ECDYSIS PROTOCOLS' },
          { icon: 'search', label: 'LATENCY AUDIT' },
          { icon: 'workflow', label: '50K FATHOMS FLOW' },
          { icon: 'document', label: 'CODEX LITURGIES' },
        ]}
      />
    )

    expect(screen.getByText('Test vault · Synaptic directives')).toBeInTheDocument()
    expect(screen.getByText('250+')).toBeInTheDocument()
    expect(screen.getByText('Oracle')).toHaveClass('text-crimson-aggro')
    expect(screen.getByText('prompts')).toBeInTheDocument()
    expect(screen.getByText('For Deep Focus & Ascension')).toBeInTheDocument()
    expect(screen.getByText(/Comment “PROMPTS” below/)).toBeInTheDocument()
    expect(screen.getByText(/Audit my open task latency/i)).toBeInTheDocument()
    expect(screen.getByText('Ecdysis protocols')).toBeInTheDocument()
    expect(screen.getByText('Codex Liturgies')).toBeInTheDocument()
    expect(container.querySelector('[data-mascot-key="lobster_pointing"]')).toBeInTheDocument()
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
    const {
      normalizeMascotKey,
      getMascotInfo,
      getAllMascotKeys,
      getRandomMascotKey,
      getRandomMascotRotation,
      MASCOT_REGISTRY,
    } = await import('./MascotOverlay')

    expect(normalizeMascotKey('pointing')).toBe('lobster_pointing')
    expect(normalizeMascotKey('lobster_pointing_cta')).toBe('lobster_pointing')
    expect(normalizeMascotKey('char_lobster_speed_action.png')).toBe('lobster_navigator')
    expect(normalizeMascotKey('navigator')).toBe('lobster_navigator')
    expect(normalizeMascotKey('stats')).toBe('crab_stats')
    expect(normalizeMascotKey('peek')).toBe('lobster_peek')
    expect(normalizeMascotKey('peaceful')).toBe('lobster_peaceful')
    expect(normalizeMascotKey('engineer')).toBe('lobster_engineer')
    expect(normalizeMascotKey('thumbs_up')).toBe('lobster_thumbs_up')

    // Random normalization
    const randomResolved = normalizeMascotKey('random')
    expect(Object.keys(MASCOT_REGISTRY)).toContain(randomResolved)

    // Random helpers
    const allKeys = getAllMascotKeys()
    expect(allKeys.length).toBeGreaterThanOrEqual(7)
    expect(allKeys).toContain(getRandomMascotKey())

    const rotation = getRandomMascotRotation(3)
    expect(rotation.length).toBe(3)
    expect(new Set(rotation).size).toBe(3)

    // Verify all registry items have valid Neon S3 CDN URLs
    expect(Object.keys(MASCOT_REGISTRY).length).toBe(22)
    expect(normalizeMascotKey('char_crab_builder_adult_v2.webp')).toBe('crab_builder')
    expect(normalizeMascotKey('lobster_peek_junior')).toBe('lobster_peek_junior')
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
    expect(img?.getAttribute('src')).toContain('char_lobster_pointing_adult_v2.webp')
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
