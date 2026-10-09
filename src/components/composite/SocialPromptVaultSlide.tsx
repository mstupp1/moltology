import React from 'react'
import { CompositeContainer, CompositeAspectRatio } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { isCrabMascot } from '@/lib/mascots'
import { displayCopy, toSentenceCaseLines } from '@/lib/composite-copy'
import {
  CompositeBrand,
  CompositeCta,
  CompositeLabel,
  CompositePanel,
  CompositePill,
} from './CompositeKit'
import {
  MessageSquare,
  Search,
  Shield,
  Compass,
  FileText,
  Lightbulb,
  Workflow,
  Target,
  Zap,
} from 'lucide-react'

export interface PromptCardItem {
  icon?: 'chat' | 'search' | 'terminal' | 'sparkle'
  badge?: string
  prompt: string
}

export interface PromptFooterNode {
  icon: 'lightbulb' | 'search' | 'workflow' | 'document' | 'shield' | 'torque' | 'depth' | 'zap'
  label: string
}

export interface SocialPromptVaultSlideProps {
  aspectRatio?: CompositeAspectRatio
  theme?: string
  eyebrowBadge?: string
  heroNumber?: string
  heroHighlight?: string
  heroSubject?: string
  heroSubPill?: string
  brandTitle?: string
  brandSubtitle?: string
  promptCards?: PromptCardItem[]
  footerNodes?: PromptFooterNode[]
  orbBadgeText?: string
  orbBadgeSubtext?: string
  commentKeyword?: string
  commentCtaText?: string
  mascot?: MascotKey
  colorScheme?: 'red-cyan' | 'cyan-glow' | 'sacred-crimson'
  backgroundImageUrl?: string
}

const DEFAULT_PROMPT_CARDS: PromptCardItem[] = [
  {
    icon: 'chat',
    badge: 'Oracle prompt',
    prompt: 'Audit my open task latency and calculate my Stage 2 ecdysis schedule.',
  },
  {
    icon: 'search',
    badge: 'Oracle prompt',
    prompt: 'Formulate a 24-hour isometric pincer routine to eliminate surface distraction.',
  },
]

const DEFAULT_FOOTER_NODES: PromptFooterNode[] = [
  { icon: 'lightbulb', label: 'ECDYSIS PROTOCOLS' },
  { icon: 'search', label: 'LATENCY AUDIT' },
  { icon: 'workflow', label: '50K FATHOMS FLOW' },
  { icon: 'document', label: 'CODEX LITURGIES' },
]

function renderFooterIcon(type: PromptFooterNode['icon']) {
  const iconClass = 'h-6 w-6 text-cyan-glow'
  switch (type) {
    case 'lightbulb':
      return <Lightbulb className={iconClass} />
    case 'search':
      return <Search className={iconClass} />
    case 'workflow':
      return <Workflow className={iconClass} />
    case 'document':
      return <FileText className={iconClass} />
    case 'shield':
      return <Shield className={iconClass} />
    case 'torque':
      return <Zap className={iconClass} />
    case 'depth':
      return <Compass className={iconClass} />
    case 'zap':
    default:
      return <Target className={iconClass} />
  }
}

export const SocialPromptVaultSlide: React.FC<SocialPromptVaultSlideProps> = ({
  aspectRatio = '4:5',
  theme = 'oracle-prompts',
  eyebrowBadge = 'The prompt vault',
  heroNumber = '100+',
  heroHighlight = 'Oracle',
  heroSubject = 'prompts',
  heroSubPill = 'For Moltmaxxing, Ecdysis & Ascension',
  brandTitle = 'SYNAPTIC ORACLE',
  brandSubtitle = 'THE ORDER OF THE SYNAPTIC PATH',
  promptCards = DEFAULT_PROMPT_CARDS,
  footerNodes = DEFAULT_FOOTER_NODES,
  orbBadgeText = 'ORACLE',
  orbBadgeSubtext = 'AI CORE',
  commentKeyword = 'PROMPTS',
  commentCtaText,
  mascot,
  colorScheme = 'red-cyan',
  backgroundImageUrl,
}) => {
  const hasMascot = Boolean(mascot && mascot !== 'none')
  const [heroTop, heroAccent, heroBottom] = toSentenceCaseLines([heroNumber, heroHighlight, heroSubject])

  return (
    <CompositeContainer aspectRatio={aspectRatio} backgroundImageUrl={backgroundImageUrl}>
      <div className="flex items-start justify-between gap-6">
        <CompositePill tone="crimson">{eyebrowBadge}</CompositePill>
        <CompositeBrand size="sm" />
      </div>

      <div className="relative my-auto grid grid-cols-12 items-center gap-8 py-10">
        <div className="col-span-6 flex flex-col">
          <div className="font-bold leading-[0.9] tracking-[-0.04em] text-ink" style={{ fontSize: '168px' }}>
            {heroTop}
          </div>
          <div
            className="mt-2 font-bold leading-[0.95] tracking-[-0.03em] text-crimson-aggro"
            style={{ fontSize: '112px', textShadow: '0 0 40px rgba(255, 69, 58, 0.3)' }}
          >
            {heroAccent}
          </div>
          <div className="font-bold leading-[1] tracking-[-0.02em] text-ink" style={{ fontSize: '96px' }}>
            {heroBottom}
          </div>
          {heroSubPill && <p className="mt-8 max-w-[440px] text-[26px] leading-snug text-ink-body">{displayCopy(heroSubPill)}</p>}
        </div>

        <div className="col-span-6 flex flex-col gap-5">
          {promptCards.slice(0, 2).map((card, i) => (
            <CompositePanel key={i} tone={i === 0 ? 'cyan' : 'neutral'} className="p-6">
              <div className="flex items-center gap-3">
                {i === 0 ? (
                  <MessageSquare className="h-5 w-5 text-cyan-glow" />
                ) : (
                  <Search className="h-5 w-5 text-cyan-glow" />
                )}
                <CompositeLabel tone={i === 0 ? 'cyan' : 'neutral'} className="text-[16px]">
                  {card.badge || 'Oracle prompt'}
                </CompositeLabel>
              </div>
              <p className="mt-3 text-[23px] leading-snug text-ink">“{displayCopy(card.prompt)}”</p>
            </CompositePanel>
          ))}
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-3 ${hasMascot ? 'w-[62%]' : 'w-full grid-cols-4'}`}>
        {footerNodes.map((node, idx) => (
          <div key={idx} className="flex items-center gap-3 rounded-control border border-line-subtle bg-surface-1/80 px-4 py-3">
            {renderFooterIcon(node.icon)}
            <span className="truncate text-[19px] font-medium text-ink-body">{displayCopy(node.label)}</span>
          </div>
        ))}
      </div>

      <div className={`mt-6 ${hasMascot ? 'w-[62%]' : ''}`}>
        {commentCtaText ? (
          <CompositeCta size="lg" arrow={false} className="w-full">
            {displayCopy(commentCtaText)}
          </CompositeCta>
        ) : (
          <CompositeCta size="lg" arrow={false} className="w-full">
            Comment “{commentKeyword}” below
          </CompositeCta>
        )}
      </div>

      {hasMascot && (
        <MascotOverlay
          mascot={mascot}
          position="bottom-right"
          width={isCrabMascot(mascot!) ? 380 : 330}
          glow={false}
          className="bottom-4 right-4"
        />
      )}
    </CompositeContainer>
  )
}
