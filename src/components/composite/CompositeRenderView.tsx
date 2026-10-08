import React, { useEffect, useState } from 'react'
import {
  CompositeStudioUI,
  CompositeTemplateType,
  CompositeAspectRatio,
  SocialHookSlide,
  SocialSpecShowdownSlide,
  SocialDirectivesSlide,
  SocialMarketingSlide,
  SocialPromptVaultSlide,
  ReelOutroCard,
  ReelSimpleOutroCard,
  ReelThumbnailCard,
  BlogSchematicCard,
  MascotKey,
} from '@/components/composite'
import { LayoutSlide } from '@/components/composite/LayoutSlide'
import { parseLayoutSpec } from '@/components/composite/layout-spec'
import { useCompositeReady } from '@/components/composite/useCompositeReady'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

export interface CompositeRenderProps {
  search: {
    template?: CompositeTemplateType
    theme?: string
    aspect?: CompositeAspectRatio
    mascot?: MascotKey
    mode?: 'preview' | 'raw'
    preview?: boolean
    secret?: string
    data?: string
    payload?: 'inject'
  }
}

/** Shape the headless capture injects as window.__COMPOSITE_PAYLOAD__ (no URL length limit). */
export interface InjectedCompositePayload {
  template?: CompositeTemplateType
  theme?: string
  aspect?: CompositeAspectRatio
  mascot?: MascotKey
  data?: Record<string, any>
}

declare global {
  interface Window {
    __COMPOSITE_PAYLOAD__?: InjectedCompositePayload
  }
}

export default function CompositeRenderView({ search }: CompositeRenderProps) {
  const isRaw = search.mode === 'raw'
  const waitsForInjection = isRaw && search.payload === 'inject'
  const [injected, setInjected] = useState<InjectedCompositePayload | null>(null)

  useEffect(() => {
    if (waitsForInjection) setInjected(window.__COMPOSITE_PAYLOAD__ ?? {})
  }, [waitsForInjection])

  const template = injected?.template || search.template || 'hook'
  const theme = injected?.theme || search.theme || 'moltmaxxing'
  const aspect = injected?.aspect || search.aspect || '4:5'
  const mascot = injected?.mascot || search.mascot || 'lobster_thumbs_up'
  const isBypass = search.preview === true || !(!search.secret)

  // Parse optional custom data payload
  let customData: Record<string, any> = injected?.data ?? {}
  if (!injected && search.data) {
    try {
      customData = JSON.parse(decodeURIComponent(search.data))
    } catch {
      // Fallback
    }
  }

  const contentReady = isRaw && (!waitsForInjection || injected !== null)
  useCompositeReady(contentReady, `${template}|${aspect}|${mascot}|${injected ? 'i' : 'u'}`)

  if (waitsForInjection && !injected) {
    return <div className="w-screen h-screen bg-[#02080c]" />
  }

  // Raw Mode: Minimal zero-padding render for headless Chrome capture
  if (isRaw) {
    return (
      <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-[#02080c] flex items-start justify-start">
        {template === 'layout' && <RawLayout data={customData} aspect={aspect} mascot={mascot} />}

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

        {template === 'prompt-vault' && (
          <SocialPromptVaultSlide
            aspectRatio={aspect}
            theme={theme}
            eyebrowBadge={customData.eyebrowBadge || customData.categoryBadge}
            heroNumber={customData.heroNumber}
            heroHighlight={customData.heroHighlight}
            heroSubject={customData.heroSubject}
            heroSubPill={customData.heroSubPill}
            brandTitle={customData.brandTitle}
            brandSubtitle={customData.brandSubtitle}
            promptCards={customData.promptCards}
            footerNodes={customData.footerNodes}
            orbBadgeText={customData.orbBadgeText}
            orbBadgeSubtext={customData.orbBadgeSubtext}
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
            bulletsTitle={customData.bulletsTitle}
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

        {template === 'reel-simple-outro' && (
          <ReelSimpleOutroCard
            url={customData.url || 'moltology.org'}
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
            leftCaption={customData.leftCaption}
            rightCaption={customData.rightCaption}
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
      skeleton={<HUDPageLoader />}
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

function RawLayout({
  data,
  aspect,
  mascot,
}: {
  data: Record<string, any>
  aspect: CompositeAspectRatio
  mascot: MascotKey
}) {
  const parsed = parseLayoutSpec(data.spec ?? data)
  if (!parsed.ok) {
    return (
      <pre data-layout-error="" className="p-8 text-red-300 text-xl whitespace-pre-wrap">
        {`Layout spec is invalid:\n${parsed.errors.join('\n')}`}
      </pre>
    )
  }
  return <LayoutSlide spec={parsed.spec} aspectRatio={aspect} mascot={mascot} showGuides={data.guides === true} />
}
