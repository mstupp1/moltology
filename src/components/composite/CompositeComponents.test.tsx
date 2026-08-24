import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CompositeContainer } from './CompositeContainer'
import { SocialHookSlide } from './SocialHookSlide'
import { SocialSpecShowdownSlide } from './SocialSpecShowdownSlide'
import { ReelOutroCard } from './ReelOutroCard'
import { ReelThumbnailCard } from './ReelThumbnailCard'
import { BlogSchematicCard } from './BlogSchematicCard'
import { SocialMarketingSlide } from './SocialMarketingSlide'

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

  it('renders SocialHookSlide with badges, headlines, and metrics', () => {
    render(
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
  })

  it('renders SocialSpecShowdownSlide with comparison cards', () => {
    render(
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
        ]}
      />
    )

    expect(screen.getByText('TEST SPEC SHOWDOWN')).toBeInTheDocument()
    expect(screen.getByText('CARD ONE')).toBeInTheDocument()
    expect(screen.getByText('99.9%')).toBeInTheDocument()
    expect(screen.getByText('First card desc')).toBeInTheDocument()
  })

  it('renders ReelOutroCard with brand emblem, headline, and CTA button', () => {
    render(
      <ReelOutroCard
        headline="ASCEND NOW"
        subheadline="CALCULATE CLEARANCE"
        url="moltology.org"
      />
    )

    expect(screen.getByText('Moltology')).toBeInTheDocument()
    expect(screen.getByText('THE SYNAPTIC PATH')).toBeInTheDocument()
    expect(screen.getByText('ASCEND NOW')).toBeInTheDocument()
    expect(screen.getByText('CALCULATE CLEARANCE')).toBeInTheDocument()
    expect(screen.getByText('moltology.org')).toBeInTheDocument()
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
    render(
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
    expect(screen.getByText('“GUIDE”')).toBeInTheDocument()
    expect(screen.getByText('SHELL HARDNESS')).toBeInTheDocument()
    expect(screen.getByText('800 NM PINCER TORQUE')).toBeInTheDocument()
    expect(screen.getByText('OFFICIAL 2026 EDITION')).toBeInTheDocument()
  })
})
