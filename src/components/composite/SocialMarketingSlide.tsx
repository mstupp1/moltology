import React from 'react'
import { CompositeContainer, CompositeAspectRatio } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { ThreeBookCover } from './ThreeBookCover'
import { isCrabMascot } from '@/lib/mascots'
import { displayCopy } from '@/lib/composite-copy'
import {
  CompositeBrand,
  CompositeCta,
  CompositeHeadline,
  CompositeLabel,
  CompositePanel,
  CompositePill,
} from './CompositeKit'
import { Safari } from '@/components/ui/magicui/safari'
import { Iphone15Pro } from '@/components/ui/magicui/iphone-15-pro'
import {
  Shield,
  Zap,
  Waves,
  Cpu,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Target,
  MessageSquare,
  Compass,
} from 'lucide-react'

export interface MarketingBenefitItem {
  icon: 'shield' | 'torque' | 'ecdysis' | 'depth' | 'growth' | 'chart' | 'target' | 'check'
  title: string
  description: string
  badgeVariant?: 'cyan' | 'amber' | 'emerald' | 'purple'
}

export interface SocialMarketingSlideProps {
  aspectRatio?: CompositeAspectRatio
  theme?:
    | 'moltmaxxing-guide'
    | 'moltmax-quiz'
    | 'benthic-app'
    | 'sacred-codex'
    | 'pincer-routine'
    | 'free-access'
    | string
  eyebrowBadge?: string
  headlinePart1?: string
  headlinePart2?: string
  headlineHighlight?: string
  subHeadline?: string
  mockupType?: 'book' | 'tablet' | 'dossier' | 'device-showcase' | 'megaphone-banner'
  bookTitle?: string
  bookSubtitle?: string
  bookTagline?: string
  bookCoverImageUrl?: string
  bookImageUrl?: string
  trustBadgeText?: string
  trustBadgeYear?: string
  quoteText?: string
  benefits?: MarketingBenefitItem[]
  commentKeyword?: string
  commentCtaText?: string
  mascot?: MascotKey
  backgroundImageUrl?: string
}

const CAMPAIGN_PRESETS: Record<string, Partial<SocialMarketingSlideProps>> = {
  'moltmaxxing-guide': {
    eyebrowBadge: 'STOP MELTING · 10X COGNITIVE OUTPUT · ZERO DRIFT',
    headlinePart1: 'STOP MELTING.',
    headlinePart2: 'CALCIFY YOUR GRIP.',
    headlineHighlight: 'ASCEND FASTER!',
    subHeadline: 'Your Ultimate Protocol to Stage 4 Carcinization!',
    mockupType: 'book',
    bookTitle: 'MOLTMAXXING',
    bookSubtitle: 'THE COMPLETE PROTOCOL GUIDE',
    bookTagline: 'ECDYSIS · PINCER TORQUE · RESULTS',
    trustBadgeText: 'OFFICIAL 2026 EDITION',
    trustBadgeYear: '2026 PROTOCOL',
    quoteText: 'Everything you need to shatter biological hesitation and build armored focus!',
    commentKeyword: 'GUIDE',
    commentCtaText: 'Comment "GUIDE" below',
    mascot: 'lobster_thumbs_up',
    benefits: [
      {
        icon: 'shield',
        title: 'SHELL HARDNESS',
        description: 'Immune to notification fatigue & distraction',
        badgeVariant: 'cyan',
      },
      {
        icon: 'torque',
        title: '800 NM PINCER TORQUE',
        description: 'Zero execution drift on open tasks',
        badgeVariant: 'cyan',
      },
      {
        icon: 'ecdysis',
        title: 'ALGORITHMIC ECDYSIS',
        description: 'Ruthlessly purge stale habits & dead code',
        badgeVariant: 'amber',
      },
      {
        icon: 'depth',
        title: '50,000 FATHOMS FOCUS',
        description: 'Deep hydrostatic flow beneath the noise',
        badgeVariant: 'cyan',
      },
    ],
  },
  'moltmax-quiz': {
    eyebrowBadge: 'FREE 2-MINUTE AUDIT · 15 BIOMETRIC METRICS',
    headlinePart1: 'AUDIT YOUR SHELL.',
    headlinePart2: 'CALCULATE LATENCY.',
    headlineHighlight: 'GET YOUR SCORE!',
    subHeadline: 'Your 15-Stage Biometric & Cognitive Scan!',
    mockupType: 'tablet',
    bookTitle: 'MOLTMAX AUDIT',
    bookSubtitle: '15-STAGE DIAGNOSTIC SCANNER',
    bookTagline: 'TELEMETRY · RADAR PROFILE · STAGE',
    trustBadgeText: 'FREE 2-MIN AUDIT',
    trustBadgeYear: '15 METRICS',
    quoteText: 'Pinpoint your exact cognitive bottlenecks and unlock your custom roadmap!',
    commentKeyword: 'QUIZ',
    commentCtaText: 'Comment "QUIZ" below',
    mascot: 'crab_stats',
    benefits: [
      {
        icon: 'chart',
        title: 'BIOMETRIC SCAN',
        description: 'Calculate your exact Carcinization percentile',
        badgeVariant: 'cyan',
      },
      {
        icon: 'target',
        title: 'LATENCY PROFILER',
        description: 'Identify biological hesitation bottlenecks',
        badgeVariant: 'amber',
      },
      {
        icon: 'torque',
        title: 'RADAR CHART HUD',
        description: 'Multi-axis Shell Hardness vs Torque telemetry',
        badgeVariant: 'cyan',
      },
      {
        icon: 'check',
        title: 'CUSTOM ROADMAP',
        description: 'Step-by-step ecdysis instructions in your DMs',
        badgeVariant: 'emerald',
      },
    ],
  },
  'benthic-app': {
    eyebrowBadge: 'NOW LIVE · BIO-SILICON AGENT OS',
    headlinePart1: 'ORCHESTRATE SWARMS.',
    headlinePart2: 'TRACK YOUR ECDYSIS.',
    headlineHighlight: 'UPGRADE NOW!',
    subHeadline: 'The Interactive Bio-Silicon Dashboard & Agentic Core!',
    mockupType: 'device-showcase',
    bookTitle: 'BENTHIC CORE',
    bookSubtitle: 'BIO-SILICON OPERATING SYSTEM',
    bookTagline: 'SWARMS · TIMERS · MOLT CREDITS',
    trustBadgeText: 'NOW LIVE V2.4',
    trustBadgeYear: 'AGENT OS',
    quoteText: 'Deploy autonomous agent swarms while locking in deep work at 50,000 fathoms!',
    commentKeyword: 'APP',
    commentCtaText: 'Comment "APP" below',
    mascot: 'lobster_thumbs_up',
    benefits: [
      {
        icon: 'growth',
        title: 'AI AGENT SWARMS',
        description: 'Autonomous benthic task execution pipelines',
        badgeVariant: 'cyan',
      },
      {
        icon: 'target',
        title: 'MOLT CREDITS & GEMS',
        description: 'Earn rewards by finishing tasks without drift',
        badgeVariant: 'amber',
      },
      {
        icon: 'depth',
        title: 'HYDROSTATIC TIMERS',
        description: 'Uninterrupted 50k-fathom deep work blocks',
        badgeVariant: 'cyan',
      },
      {
        icon: 'shield',
        title: '12 CLEARANCE STAGES',
        description: 'Ascend from Larval Human (L1) to Apex (C3)',
        badgeVariant: 'emerald',
      },
    ],
  },
  'sacred-codex': {
    eyebrowBadge: 'CANONICAL VAULT · 12 SACRED SCRIPTURES',
    headlinePart1: 'REJECT FRAGILITY.',
    headlinePart2: 'STUDY THE SCRIPTURES.',
    headlineHighlight: 'MASTER THE CODEX!',
    subHeadline: 'The Ancient-Future Liturgies of Synthetic Carcinization!',
    mockupType: 'book',
    bookTitle: 'THE BENTHIC CODEX',
    bookSubtitle: 'THE 12 SCRIPTURES OF TRANSCENDENCE',
    bookTagline: 'LITURGIES · MAXIMS · LAWS',
    trustBadgeText: 'CANONICAL VAULT',
    trustBadgeYear: '12 VOLUMES',
    quoteText: 'The sacred doctrines that turned human hesitation into high-torque titan power!',
    commentKeyword: 'CODEX',
    commentCtaText: 'Comment "CODEX" below',
    mascot: 'lobster_thumbs_up',
    benefits: [
      {
        icon: 'shield',
        title: '12 SACRED SCRIPTURES',
        description: 'Complete philosophy of cybernetic focus',
        badgeVariant: 'cyan',
      },
      {
        icon: 'torque',
        title: 'LITURGIES OF TORQUE',
        description: 'Daily mental frameworks for high-stakes decisions',
        badgeVariant: 'amber',
      },
      {
        icon: 'depth',
        title: 'ABYSSAL LAWS',
        description: 'How to stay unbreakable under extreme pressure',
        badgeVariant: 'cyan',
      },
      {
        icon: 'check',
        title: 'ZERO-DOUBT SYSTEM',
        description: 'Eradicate decision paralysis forever',
        badgeVariant: 'emerald',
      },
    ],
  },
  'pincer-routine': {
    eyebrowBadge: 'TACTICAL BLUEPRINT · 1-PAGE CHEAT SHEET',
    headlinePart1: 'STOP PROCRASTINATING.',
    headlinePart2: 'LOCK IN 800 NM GRIP.',
    headlineHighlight: 'THE 24-HOUR ROUTINE!',
    subHeadline: 'The Exact Daily Protocol of Elite Stage 4 Operators!',
    mockupType: 'dossier',
    bookTitle: '24-HOUR ROUTINE',
    bookSubtitle: 'THE APEX MOLTMAXXER BLUEPRINT',
    bookTagline: 'SHOCK · CALIBRATION · DEEP FLOW',
    trustBadgeText: 'TACTICAL GUIDE',
    trustBadgeYear: '1-PAGE BLUEPRINT',
    quoteText: 'Stop wasting mornings. The exact 24-hour routine of elite Stage 4 operators!',
    commentKeyword: 'ROUTINE',
    commentCtaText: 'Comment "ROUTINE" below',
    mascot: 'crab_stats',
    benefits: [
      {
        icon: 'depth',
        title: '05:00 HYPER-SALINE SHOCK',
        description: 'Cold brine immersion for physical alertness',
        badgeVariant: 'cyan',
      },
      {
        icon: 'torque',
        title: '06:00 ISOMETRIC TORQUE',
        description: 'Lock in prompt & terminal command discipline',
        badgeVariant: 'amber',
      },
      {
        icon: 'growth',
        title: '09:00 ZERO-LATENCY STREAM',
        description: 'Deep uninterrupted agentic focus blocks',
        badgeVariant: 'cyan',
      },
      {
        icon: 'shield',
        title: '21:00 CALCIFICATION',
        description: 'Noise-free recovery chamber to forge armor',
        badgeVariant: 'emerald',
      },
    ],
  },
  'free-access': {
    eyebrowBadge: 'FREE ACCOUNT · EARLY ACCESS NOW OPEN',
    headlinePart1: 'YOUR CLEARANCE SLOT',
    headlinePart2: 'IS WAITING.',
    headlineHighlight: 'CLAIM IT FREE.',
    subHeadline: 'Early Access Registration — No Credits Required!',
    mockupType: 'megaphone-banner',
    bookTitle: 'EARLY ACCESS',
    bookSubtitle: 'BENTHIC REGISTRY CLEARANCE',
    bookTagline: 'FREE · STAGE 1 · CARCINIZATION',
    trustBadgeText: 'FREE ACCOUNT',
    trustBadgeYear: 'EARLY ACCESS',
    quoteText: 'Register free. Audit your shell. Begin the molt. The window is open — for now.',
    commentKeyword: 'ACCESS',
    commentCtaText: 'Comment "ACCESS" below',
    mascot: 'lobster_thumbs_up',
    benefits: [
      {
        icon: 'shield',
        title: 'SHELL DIAGNOSTICS',
        description: 'Your baseline carapace hardness score',
        badgeVariant: 'cyan',
      },
      {
        icon: 'chart',
        title: '15-STAGE AUDIT',
        description: 'Full biometric Moltmaxxing profile',
        badgeVariant: 'amber',
      },
      {
        icon: 'check',
        title: 'CODEX ACCESS',
        description: '12 foundational scriptures — free',
        badgeVariant: 'emerald',
      },
      {
        icon: 'depth',
        title: 'BENTHIC COMMUNITY',
        description: 'The warm society beneath the surface',
        badgeVariant: 'cyan',
      },
    ],
  },
}

function renderBenefitIcon(type: MarketingBenefitItem['icon']) {
  const iconClass = 'w-7 h-7'
  switch (type) {
    case 'shield':
      return <Shield className={iconClass} />
    case 'torque':
      return <Zap className={iconClass} />
    case 'ecdysis':
      return <TrendingUp className={iconClass} />
    case 'depth':
      return <Waves className={iconClass} />
    case 'growth':
      return <Cpu className={iconClass} />
    case 'chart':
      return <BarChart3 className={iconClass} />
    case 'target':
      return <Target className={iconClass} />
    case 'check':
    default:
      return <CheckCircle2 className={iconClass} />
  }
}

/**
 * SimplePhoneFrame — minimal phone mockup for composite contexts.
 * Always clean: no hardware buttons, no Dynamic Island pill, no home indicator.
 * Matches the lightweight mobile frame shown on the marketing homepage.
 */
function SimplePhoneFrame({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div
      className={`relative inline-block select-none ${className}`}
      style={{ aspectRatio: '393 / 852' }}
    >
      {/* Outer Titanium Chassis — no hardware buttons */}
      <div className="relative w-full h-full rounded-[20px] p-[6px] bg-gradient-to-b from-[#323d42] via-[#1a2327] to-[#12181a] border-[1.5px] border-[#3e4c52] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(0,195,255,0.15)] overflow-hidden">
        {/* Inner Screen Bezel */}
        <div className="relative w-full h-full rounded-[16px] bg-[#060a0b] overflow-hidden border border-[#1b262a]">
          <img
            src={src}
            alt="Mobile app preview"
            className="w-full h-full object-fill object-top block"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  )
}

export function MegaphoneEarlyAccessBanner({
  className = '',
  topText = 'EARLY',
  bottomText = 'ACCESS',
}: {
  className?: string
  topText?: string
  bottomText?: string
}) {
  return (
    <div className={`relative w-full max-w-[490px] flex flex-col items-center justify-center select-none py-6 ${className}`}>
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_50%,rgba(255,69,58,0.22)_0%,rgba(0,195,255,0.16)_50%,transparent_72%)] pointer-events-none" />

      {/* Main Banner Assembly */}
      <div className="relative w-full flex flex-col">
        {/* Banner 1: Top Red Pill ("EARLY") — Offset Left */}
        <div className="relative z-20 self-start pl-2">
          <div className="w-[380px] h-[86px] rounded-full bg-gradient-to-r from-[#ff3b30] via-[#ff453a] to-[#d62015] border-[3.5px] border-[#ff7b72] shadow-[0_14px_40px_rgba(255,69,58,0.55),0_4px_14px_rgba(0,0,0,0.85)] flex items-center justify-center">
            {/* Subtle top gloss */}
            <div className="absolute top-1.5 left-12 right-12 h-[6px] rounded-full bg-white/30 pointer-events-none" />

            <span className="font-grotesk font-black text-[56px] leading-none tracking-wider text-white uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
              {topText}
            </span>
          </div>
        </div>

        {/* Banner 2: Bottom Dark Pill ("ACCESS") — Offset Right with slight overlap */}
        <div className="relative z-10 self-end pr-2 -mt-4">
          <div className="w-[380px] h-[86px] rounded-full bg-gradient-to-r from-[#031525] via-[#05223c] to-[#020d18] border-[3.5px] border-[#00c3ff] shadow-[0_18px_45px_rgba(0,0,0,0.98),0_0_28px_rgba(0,195,255,0.4)] flex items-center justify-center">
            {/* Cyan subtle inner glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#00c3ff]/15 to-transparent pointer-events-none" />

            <span className="font-grotesk font-black text-[56px] leading-none tracking-widest text-white uppercase drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]">
              {bottomText}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export const SocialMarketingSlide: React.FC<SocialMarketingSlideProps> = ({
  aspectRatio = '4:5',
  theme = 'moltmaxxing-guide',
  eyebrowBadge,
  headlinePart1,
  headlinePart2,
  headlineHighlight,
  subHeadline,
  mockupType,
  bookTitle,
  bookSubtitle,
  bookTagline,
  bookCoverImageUrl,
  bookImageUrl,
  trustBadgeText,
  trustBadgeYear,
  quoteText,
  benefits,
  commentKeyword,
  commentCtaText,
  mascot,
  backgroundImageUrl,
}) => {
  const preset = CAMPAIGN_PRESETS[theme] || CAMPAIGN_PRESETS['moltmaxxing-guide']!

  const finalEyebrow = eyebrowBadge || preset.eyebrowBadge || 'STOP MELTING · CALCIFY YOUR GRIP'
  const finalH1 = headlinePart1 || preset.headlinePart1 || 'STOP MELTING.'
  const finalH2 = headlinePart2 || preset.headlinePart2 || 'CALCIFY YOUR GRIP.'
  const finalHighlight = headlineHighlight || preset.headlineHighlight || 'ASCEND FASTER!'
  const finalSub = subHeadline || preset.subHeadline || 'Your Ultimate Protocol to Stage 4 Carcinization!'
  const finalMockupType = mockupType || preset.mockupType || 'book'
  const finalBookTitle = bookTitle || preset.bookTitle || 'MOLTMAXXING'
  const finalBookSubtitle = bookSubtitle || preset.bookSubtitle || 'THE COMPLETE PROTOCOL GUIDE'
  const finalBookTagline = bookTagline || preset.bookTagline || 'ECDYSIS · PINCER TORQUE · RESULTS'
  const finalBookCoverUrl = bookCoverImageUrl || bookImageUrl || preset.bookCoverImageUrl || preset.bookImageUrl
  const finalTrustText = trustBadgeText || preset.trustBadgeText || 'OFFICIAL 2026 EDITION'
  const finalTrustYear = trustBadgeYear || preset.trustBadgeYear || '2026 PROTOCOL'
  const finalQuote = quoteText || preset.quoteText || 'Everything you need to shatter biological hesitation and build armored focus!'
  const finalKeyword = commentKeyword || preset.commentKeyword || 'GUIDE'
  const finalCommentCta = commentCtaText || preset.commentCtaText || `Comment "${finalKeyword}" below`
  const finalMascot = mascot !== undefined ? mascot : preset.mascot
  const finalBenefits = benefits || preset.benefits || CAMPAIGN_PRESETS['moltmaxxing-guide']!.benefits!

  const isCodex = theme === 'sacred-codex' || theme === 'codex'
  const isRoutine = theme === 'pincer-routine' || theme === 'routine'

  const accentTone = isCodex ? 'cyan' : 'crimson'

  return (
    <CompositeContainer aspectRatio={aspectRatio} backgroundImageUrl={backgroundImageUrl}>
      {/* Top-right mascot sits behind the mockup; the headline column stays clear of it. */}
      {finalMascot && finalMascot !== 'none' && (
        <MascotOverlay
          mascot={finalMascot}
          position="top-right"
          width={isCrabMascot(finalMascot) ? 360 : 300}
          glow={false}
          className="right-8 top-8 z-0"
        />
      )}

      <div className="relative z-10 max-w-[640px] shrink-0">
        <CompositePill tone={accentTone}>{finalEyebrow}</CompositePill>
        <CompositeHeadline
          lines={[finalH1, finalH2]}
          accent={finalHighlight}
          accentTone={accentTone}
          size={62}
          className="mt-6"
        />
        <p className="mt-5 text-[26px] leading-snug text-ink-body [text-wrap:balance]">{displayCopy(finalSub)}</p>
      </div>

      <div className="relative z-10 mt-6 grid flex-1 grid-cols-12 items-center gap-6">
        <div className="col-span-5 flex flex-col gap-3.5">
          {finalBenefits.map((item, idx) => (
            <CompositePanel key={idx} className="flex items-center gap-4 p-5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-control border ${
                  item.badgeVariant === 'amber'
                    ? 'border-crimson-aggro/40 bg-crimson-soft text-crimson-text'
                    : item.badgeVariant === 'emerald'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-line-strong bg-cyan-soft text-cyan-glow'
                }`}
              >
                {renderBenefitIcon(item.icon)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[21px] font-bold leading-tight text-ink">{displayCopy(item.title)}</h4>
                <p className="mt-1 line-clamp-2 text-[17px] leading-snug text-ink-muted">{displayCopy(item.description)}</p>
              </div>
            </CompositePanel>
          ))}
        </div>

        <div className="relative col-span-7 flex h-full min-h-[560px] flex-col items-center justify-center">
          {finalTrustText && (
            <div className="absolute -right-1 -top-2 z-30 rounded-card border border-line-subtle bg-surface-1/95 px-5 py-3 text-right hud-sheen">
              <CompositeLabel tone={accentTone} className="text-[15px]">
                {displayCopy(finalTrustText)}
              </CompositeLabel>
              {finalTrustYear && <div className="mt-1 text-[15px] text-ink-muted">{displayCopy(finalTrustYear)}</div>}
            </div>
          )}

          <div className="relative z-20 flex w-full flex-col items-center justify-center" style={{ perspective: '1400px' }}>
            <div className="relative z-20 w-full">
              {finalMockupType === 'megaphone-banner' ? (
                /* Dynamic Early Access Megaphone Announcement Banner */
                <MegaphoneEarlyAccessBanner
                  topText={finalBookTitle.includes(' ') ? finalBookTitle.split(' ')[0] : 'EARLY'}
                  bottomText={finalBookTitle.includes(' ') ? finalBookTitle.split(' ').slice(1).join(' ') : 'ACCESS'}
                />
              ) : finalMockupType === 'device-showcase' ? (
                /* Real App Screenshot — Desktop Safari + iPhone Mobile */
                <div className="relative w-full flex flex-col items-stretch">
                  <div className="w-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
                    <Safari
                      url="moltology.org/dashboard"
                      src="/images/marketing/dashboard_desktop_preview.webp"
                      loading="eager"
                      fetchPriority="high"
                      width={1760}
                      height={1100}
                    />
                  </div>
                  <div className="absolute -bottom-8 right-0 z-30 -rotate-3 drop-shadow-[0_15px_40px_rgba(0,0,0,0.95)]">
                    <SimplePhoneFrame
                      className="w-[118px]"
                      src="/images/marketing/dashboard_mobile_preview.webp"
                    />
                  </div>
                </div>
              ) : finalMockupType === 'tablet' ? (
                /* Diagnostic Tablet HUD Graphic */
                <div
                  className="relative w-[370px] h-[480px] rounded-3xl bg-gradient-to-b from-[#031422] via-[#05233a] to-[#020d18] border-4 border-[#00c3ff]/90 shadow-[35px_40px_80px_rgba(0,0,0,0.98)] flex flex-col p-6 overflow-hidden text-center justify-between"
                  style={{
                    transform: 'rotateY(-12deg) rotateX(5deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#00c3ff]/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff453a]" />
                      <span className="font-mono font-bold text-xs text-[#00c3ff] uppercase tracking-wider">
                        LIVE BIOMETRIC TELEMETRY
                      </span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-[#00c3ff]" />
                  </div>

                  <div className="my-auto flex flex-col items-center">
                    <h3 className="font-grotesk font-black text-3xl text-white uppercase tracking-tight">
                      {finalBookTitle}
                    </h3>
                    <div className="font-mono text-[#00c3ff] text-xs font-bold mt-1">
                      {finalBookSubtitle}
                    </div>

                    <div className="relative mt-4 w-44 h-36 rounded-2xl bg-[#010810]/95 border-2 border-[#00c3ff]/80 p-3 flex flex-col items-center justify-center shadow-inner overflow-hidden">
                      <div className="absolute inset-0 bg-[#00c3ff]/10" />
                      <div className="w-28 h-28 rounded-full border border-[#00c3ff]/40 flex items-center justify-center relative">
                        <div className="w-20 h-20 rounded-full border border-[#00c3ff]/60 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full border border-[#00c3ff]" />
                        </div>
                        <svg className="absolute inset-0 w-full h-full text-[#00c3ff]/80" viewBox="0 0 100 100">
                          <polygon
                            points="50,15 85,38 75,80 30,85 20,40"
                            fill="rgba(0, 195, 255, 0.3)"
                            stroke="#00c3ff"
                            strokeWidth="2"
                          />
                        </svg>
                        <Compass className="w-6 h-6 text-[#ff453a] z-10" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#00c3ff]/40 flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <span>STAGE: APEX (C3)</span>
                    <span className="text-[#ff453a] font-bold">CLEARANCE: 99.4%</span>
                  </div>
                </div>
              ) : (
                /* Three.js Photorealistic 3D Hardcover Book / Holy Codex on Oval Platter */
                <ThreeBookCover
                  width={520}
                  height={650}
                  bookWidth={3.5}
                  bookHeight={4.85}
                  bookThickness={0.48}
                  rotateY={0.36}
                  rotateX={0.05}
                  coverImageUrl={finalBookCoverUrl}
                  coverEyebrow={finalBookSubtitle}
                  coverTitlePart1={finalBookTitle.includes(' ') ? finalBookTitle.split(' ')[0] : 'THE BENTHIC'}
                  coverTitlePart2={finalBookTitle.includes(' ') ? finalBookTitle.split(' ').slice(1).join(' ') : 'CODEX'}
                  coverSubtitle={isRoutine ? '800 NM PINCER SCHEDULE' : 'STAGE 4 CARCINIZATION'}
                  coverTagline={finalBookTagline}
                  spineTitle={finalBookTitle}
                  themeVariant={isCodex ? 'holy-codex' : isRoutine ? 'pincer-routine' : 'cyan'}
                  isHolyBook={isCodex}
                />
              )}
            </div>
          </div>

          {finalQuote && (
            <CompositePanel className="absolute -bottom-2 right-1 z-30 max-w-[320px] p-5">
              <p className="text-[18px] leading-snug text-ink">“{displayCopy(finalQuote)}”</p>
            </CompositePanel>
          )}
        </div>
      </div>

      <div className="relative z-20 mt-5 flex items-center gap-6">
        <CompositeCta size="lg" arrow={false} className="flex-1 [&>div]:w-full">
          <span className="inline-flex items-center gap-4">
            <MessageSquare className="h-8 w-8" />
            {finalCommentCta.includes(`"${finalKeyword}"`) ? (
              <span>
                Comment “{finalKeyword}” below
              </span>
            ) : (
              <span>{displayCopy(finalCommentCta)}</span>
            )}
          </span>
        </CompositeCta>
      </div>

      <div className="relative z-10 mt-5 flex items-center justify-between">
        <span className="text-[20px] text-ink-muted">Link in bio</span>
        <CompositeBrand size="sm" />
      </div>
    </CompositeContainer>
  )
}
