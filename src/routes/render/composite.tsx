import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  CompositeStudioUI,
  CompositeTemplateType,
  CompositeAspectRatio,
  SocialHookSlide,
  SocialSpecShowdownSlide,
  SocialDirectivesSlide,
  SocialMarketingSlide,
  ReelOutroCard,
  ReelThumbnailCard,
  BlogSchematicCard,
  MascotKey,
} from '@/components/composite'
import { authClient } from '@/lib/auth-client'
import { getUserProfileFn } from '@/lib/server/api'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'

interface CompositeSearchParams {
  template?: CompositeTemplateType
  theme?: string
  aspect?: CompositeAspectRatio
  mascot?: MascotKey
  mode?: 'preview' | 'raw'
  preview?: boolean
  secret?: string
  data?: string
}

export const Route = createFileRoute('/render/composite')({
  validateSearch: (search: Record<string, unknown>): CompositeSearchParams => {
    return {
      template: (search.template as CompositeTemplateType) || 'hook',
      theme: (search.theme as string) || 'moltmaxxing',
      aspect: (search.aspect as CompositeAspectRatio) || '4:5',
      mascot: (search.mascot as MascotKey) || 'lobster_thumbs_up',
      mode: (search.mode as 'preview' | 'raw') || 'preview',
      preview: search.preview === true || search.preview === 'true',
      secret: search.secret as string | undefined,
      data: search.data as string | undefined,
    }
  },
  head: () => ({
    meta: [
      { title: 'Composite Studio & Render Engine · Moltology' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: CompositeRenderRoute,
})

function CompositeRenderRoute() {
  const search = Route.useSearch()
  const template = search.template || 'hook'
  const theme = search.theme || 'moltmaxxing'
  const aspect = search.aspect || '4:5'
  const mascot = search.mascot || 'lobster_thumbs_up'
  const isRaw = search.mode === 'raw'
  const isBypass = search.preview === true || !!search.secret

  // Parse optional custom data payload
  let customData: Record<string, any> = {}
  if (search.data) {
    try {
      customData = JSON.parse(decodeURIComponent(search.data))
    } catch {
      // Fallback
    }
  }

  // Raw Mode: Minimal zero-padding render for headless Chrome capture
  if (isRaw) {
    return (
      <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-[#02080c] flex items-start justify-start">
        {template === 'marketing-leadmagnet' && (
          <SocialMarketingSlide
            aspectRatio={aspect}
            theme={theme}
            eyebrowBadge={customData.eyebrowBadge || customData.categoryBadge}
            headlinePart1={customData.headlinePart1}
            headlinePart2={customData.headlinePart2}
            headlineHighlight={customData.headlineHighlight}
            subHeadline={customData.subHeadline || customData.subtitle}
            bookTitle={customData.bookTitle}
            bookSubtitle={customData.bookSubtitle}
            bookTagline={customData.bookTagline}
            trustBadgeText={customData.trustBadgeText}
            trustBadgeYear={customData.trustBadgeYear}
            quoteText={customData.quoteText}
            benefits={customData.benefits}
            commentKeyword={customData.commentKeyword}
            commentCtaText={customData.commentCtaText}
            mascot={mascot}
            backgroundImageUrl={customData.backgroundImageUrl}
          />
        )}

        {template === 'hook' && (
          <SocialHookSlide
            aspectRatio={aspect}
            theme={theme}
            categoryBadge={customData.categoryBadge}
            headlinePart1={customData.headlinePart1}
            headlinePart2={customData.headlinePart2}
            headlineHighlight={customData.headlineHighlight}
            narrativeText={customData.narrativeText}
            leftMetric={customData.leftMetric}
            rightMetric={customData.rightMetric}
            bulletPoints={customData.bulletPoints}
            mascot={mascot}
            backgroundImageUrl={customData.backgroundImageUrl}
          />
        )}

        {template === 'spec-showdown' && (
          <SocialSpecShowdownSlide
            aspectRatio={aspect}
            categoryBadge={customData.categoryBadge}
            headline={customData.headline}
            cards={customData.cards}
            mascot={mascot}
            backgroundImageUrl={customData.backgroundImageUrl}
          />
        )}

        {template === 'directives' && (
          <SocialDirectivesSlide
            aspectRatio={aspect}
            categoryBadge={customData.categoryBadge}
            headlinePart1={customData.headlinePart1}
            headlinePart2={customData.headlinePart2}
            directives={customData.directives}
            ctaHeader={customData.ctaHeader}
            ctaButtonText={customData.ctaButtonText}
            ctaSubtitle={customData.ctaSubtitle}
            mascot={mascot}
            backgroundImageUrl={customData.backgroundImageUrl}
          />
        )}

        {template === 'reel-outro' && (
          <ReelOutroCard
            headline={customData.headline}
            subheadline={customData.subheadline}
            url={customData.url}
            actionBadgeText={customData.actionBadgeText || customData.actionText || customData.ctaActionText}
            linkInBioText={customData.linkInBioText}
            ctaTexture={customData.ctaTexture}
            mascot={mascot}
            backgroundImageUrl={customData.backgroundImageUrl}
          />
        )}

        {template === 'reel-thumbnail' && (
          <ReelThumbnailCard
            headline={customData.headline}
            subtitle={customData.subtitle}
            categoryBadge={customData.categoryBadge}
            mascot={mascot}
            backgroundImageUrl={customData.backgroundImageUrl}
          />
        )}

        {template === 'blog-schematic' && (
          <BlogSchematicCard
            categoryBadge={customData.categoryBadge}
            headline={customData.headline}
            subtitle={customData.subtitle}
            leftTitle={customData.leftTitle}
            leftMetric={customData.leftMetric}
            leftBullets={customData.leftBullets}
            rightTitle={customData.rightTitle}
            rightMetric={customData.rightMetric}
            rightBullets={customData.rightBullets}
            mascot={mascot}
            backgroundImageUrl={customData.backgroundImageUrl}
          />
        )}
      </div>
    )
  }

  // Interactive Studio Mode: Protected with Role/Guest Lock Guard
  return (
    <GuestLockGuard
      bypass={isBypass}
      featureName="COMPOSITE STUDIO"
      title="COMPOSITE STUDIO LOCKED"
      message="Access to the high-DPI composite and graphic generation studio is restricted to Moltology Administrators and Superadmins. Sign in with an authorized administrator account to access."
    >
      <CompositeStudioUI
        initialTemplate={template}
        initialTheme={theme}
        initialAspect={aspect}
        initialMascot={mascot}
      />
    </GuestLockGuard>
  )
}
