import React from 'react'
import { CompositeContainer, CompositeAspectRatio } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { ThreeBookCover } from './ThreeBookCover'
import { MoltNationLogo } from '@/components/news/MoltNationLogo'
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
  mockupType?: 'book' | 'tablet' | 'dossier'
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
    mockupType: 'tablet',
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
    mockupType: 'tablet',
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

  return (
    <CompositeContainer
      aspectRatio={aspectRatio}
      backgroundImageUrl={backgroundImageUrl}
      showScanlines={true}
      showCornerBrackets={false}
      className="bg-gradient-to-b from-[#010812] via-[#02182b] to-[#01060e] flex flex-col justify-between p-8"
    >
      {/* Top-Right Crustacean Mascot (Layered underneath the nearby badge & book) */}
      {finalMascot && finalMascot !== 'none' && (
        <MascotOverlay
          mascot={finalMascot}
          position="top-right"
          width={440}
          glow={false}
          className="top-2 right-0 z-0 drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]"
        />
      )}

      {/* Background Subtle Tech Dot Grid */}
      <div className="absolute top-40 left-8 grid grid-cols-6 gap-2.5 opacity-30 pointer-events-none">
        {Array.from({ length: 36 }).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        ))}
      </div>

      {/* 1. Header Section: Eyebrow Badge & Punchy Impact Headline */}
      <div className="z-10 shrink-0 max-w-[660px]">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 border-2 border-yellow-100 shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
          <span className="w-3 h-3 rounded-full bg-slate-950" />
          <span className="font-mono font-black text-[15px] tracking-wider text-slate-950 uppercase">
            {finalEyebrow}
          </span>
        </div>

        {/* 3-Line Massive Headline */}
        <div className="mt-4 space-y-1">
          <h1 className="text-[58px] leading-[0.98] font-black text-white tracking-tight uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            {finalH1}
          </h1>
          <h2 className="text-[58px] leading-[0.98] font-black text-white tracking-tight uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            {finalH2}
          </h2>
          <h2 className="text-[64px] leading-[0.98] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] tracking-tight uppercase">
            {finalHighlight}
          </h2>
        </div>

        {/* Sub-headline / Hook */}
        <div className="mt-3.5 flex items-center gap-3">
          <div className="w-2.5 h-7 bg-amber-400 rounded-full shadow-sm" />
          <p className="text-[24px] font-bold text-slate-100 tracking-wide">
            {finalSub}
          </p>
        </div>
      </div>

      {/* 2. Main Content Split: Left Benefits Column + Right 3D Mockup */}
      <div className="mt-4 mb-2 grid grid-cols-12 gap-6 items-center flex-1 relative z-10">
        
        {/* Left Column (5.2 Cols): 4 Benefit Cards with Circular Badges */}
        <div className="col-span-5 flex flex-col justify-center space-y-4">
          {finalBenefits.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-5 rounded-2xl bg-[#041b30]/95 border-2 border-cyan-400/50 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md transition-transform"
            >
              {/* Circular Icon Badge */}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                  item.badgeVariant === 'amber'
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 border-2 border-amber-100'
                    : item.badgeVariant === 'emerald'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-300 text-slate-950 border-2 border-emerald-100'
                    : 'bg-gradient-to-tr from-cyan-500 to-sky-200 text-slate-950 border-2 border-cyan-100'
                }`}
              >
                {renderBenefitIcon(item.icon)}
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1">
                <h4 className="font-mono font-black text-[19px] tracking-wide text-white uppercase leading-tight truncate">
                  {item.title}
                </h4>
                <p className="text-[16px] text-slate-200 font-sans font-medium leading-snug mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column (7 Cols): 3D Mockup + Trust Badge + Quote Bubble */}
        <div className="col-span-7 relative flex flex-col items-center justify-center h-full min-h-[560px]">
          {/* Subtle Atmospheric Stage Back-Glow linking character, badge, and platter */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_52%,rgba(0,195,255,0.14)_0%,rgba(251,191,36,0.07)_40%,transparent_72%)] pointer-events-none" />

          {/* Top-Right Circular Golden Trust Certification Seal */}
          <div className="absolute -top-2 -right-1 z-30 flex flex-col items-center justify-center shrink-0">
            <div className="w-[148px] h-[148px] rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600 p-1.5 shadow-[0_16px_35px_rgba(0,0,0,0.95)] shrink-0">
              <div className="w-full h-full rounded-full bg-[#060b12] border-2 border-amber-300 flex flex-col items-center justify-center text-center p-2.5">
                <div className="flex gap-0.5 text-amber-300 text-[13px]">
                  {'★★★★★'}
                </div>
                <div className="font-mono font-black text-[12.5px] uppercase text-amber-300 leading-tight mt-1">
                  {finalTrustText}
                </div>
                <div className="w-12 h-[1.5px] bg-amber-400 my-1" />
                <div className="font-mono font-bold text-[10px] tracking-wider uppercase text-amber-200">
                  {finalTrustYear}
                </div>
              </div>
            </div>
          </div>

          {/* 3D Realistic Hardcover Book / Tablet HUD Container */}
          <div
            className="relative z-20 flex flex-col items-center justify-center"
            style={{
              perspective: '1400px',
            }}
          >
            {/* 3D Mockup Graphic */}
            <div className="relative z-20">
              {finalMockupType === 'tablet' ? (
                /* Diagnostic Tablet HUD Graphic (Enlarged) */
                <div
                  className="relative w-[370px] h-[480px] rounded-3xl bg-gradient-to-b from-[#031422] via-[#05233a] to-[#020d18] border-4 border-cyan-400/90 shadow-[35px_40px_80px_rgba(0,0,0,0.98)] flex flex-col p-6 overflow-hidden text-center justify-between"
                  style={{
                    transform: 'rotateY(-12deg) rotateX(5deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Top Bezel & Camera */}
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-500/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="font-mono font-bold text-xs text-cyan-300 uppercase tracking-wider">
                        LIVE BIOMETRIC TELEMETRY
                      </span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  </div>

                  {/* Tablet Center Radar & Telemetry */}
                  <div className="my-auto flex flex-col items-center">
                    <h3 className="font-grotesk font-black text-3xl text-white uppercase tracking-tight">
                      {finalBookTitle}
                    </h3>
                    <div className="font-mono text-cyan-300 text-xs font-bold mt-1">
                      {finalBookSubtitle}
                    </div>

                    {/* Multi-Axis Radar Scan Graphic */}
                    <div className="relative mt-4 w-44 h-36 rounded-2xl bg-[#010810]/95 border-2 border-cyan-400/80 p-3 flex flex-col items-center justify-center shadow-inner overflow-hidden">
                      <div className="absolute inset-0 bg-cyan-500/10" />
                      <div className="w-28 h-28 rounded-full border border-cyan-500/40 flex items-center justify-center relative">
                        <div className="w-20 h-20 rounded-full border border-cyan-500/60 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full border border-cyan-400" />
                        </div>
                        {/* Radar Polygon Shape */}
                        <svg className="absolute inset-0 w-full h-full text-cyan-400/80" viewBox="0 0 100 100">
                          <polygon
                            points="50,15 85,38 75,80 30,85 20,40"
                            fill="rgba(0, 255, 230, 0.3)"
                            stroke="#00ffe6"
                            strokeWidth="2"
                          />
                        </svg>
                        <Compass className="w-6 h-6 text-amber-300 z-10" />
                      </div>
                    </div>
                  </div>

                  {/* Tablet Footer */}
                  <div className="pt-2 border-t border-cyan-500/40 flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <span>STAGE: APEX (C3)</span>
                    <span className="text-amber-300 font-bold">CLEARANCE: 99.4%</span>
                  </div>
                </div>
              ) : (
                /* Three.js Photorealistic 3D Hardcover Book on Oval Platter */
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
                  coverTitlePart1={finalBookTitle.includes(' ') ? finalBookTitle.split(' ')[0] : 'MOLT'}
                  coverTitlePart2={finalBookTitle.includes(' ') ? finalBookTitle.split(' ').slice(1).join(' ') : 'MAXXING'}
                  coverSubtitle="STAGE 4 CARCINIZATION"
                  coverTagline={finalBookTagline}
                  spineTitle={finalBookTitle}
                  themeVariant={theme === 'sacred-codex' ? 'amber' : 'cyan'}
                />
              )}
            </div>
          </div>

          {/* Floating Quote Callout on Lower Right */}
          <div className="absolute -bottom-2 right-1 z-30 max-w-[245px] p-3.5 rounded-2xl bg-[#031522]/98 border-2 border-amber-400 shadow-[0_15px_35px_rgba(0,0,0,0.95)] backdrop-blur-md">
            <div className="flex items-start gap-1.5">
              <span className="text-amber-400 font-serif text-2xl leading-none">“</span>
              <p className="text-xs font-semibold text-slate-100 leading-snug">
                {finalQuote}
              </p>
              <span className="text-amber-400 font-serif text-2xl leading-none self-end">”</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Massive High-Contrast Comment-to-DM Bottom CTA Banner */}
      <div className="mt-2 z-20 shrink-0">
        <div className="w-full py-6 px-9 rounded-3xl bg-[#01060e] border-4 border-amber-400 shadow-[0_20px_45px_rgba(0,0,0,0.95)] flex items-center justify-between relative overflow-hidden">
          {/* Subtle static amber background accent */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-400/15 to-amber-500/10 pointer-events-none" />

          {/* Left Arrow Accents (No lightning bolt emojis) */}
          <div className="flex items-center gap-2 text-amber-300 font-black text-3xl hidden sm:flex">
            <span>👉</span>
          </div>

          {/* Center Callout: Comment "KEYWORD" below */}
          <div className="flex items-center justify-center gap-4 mx-auto">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-2xl font-black shrink-0 border-2 border-yellow-100">
              <MessageSquare className="w-8 h-8 fill-slate-950" />
            </div>
            <div className="flex items-baseline gap-3.5">
              <span className="font-grotesk font-black text-3xl md:text-4xl text-white tracking-wide uppercase drop-shadow-md">
                Comment
              </span>
              <span className="font-grotesk font-black text-4xl md:text-5xl text-amber-300 tracking-wider uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                “{finalKeyword}”
              </span>
              <span className="font-grotesk font-black text-3xl md:text-4xl text-white tracking-wide uppercase drop-shadow-md">
                below
              </span>
            </div>
          </div>

          {/* Right Arrow Accents (No lightning bolt emojis) */}
          <div className="flex items-center gap-2 text-amber-300 font-black text-3xl hidden sm:flex">
            <span>👈</span>
          </div>
        </div>
      </div>

      {/* 4. Sub-footer Link in Bio & Watermark */}
      <div className="mt-3 flex items-center justify-between text-sm font-mono text-slate-400 z-10 shrink-0">
        <div className="flex items-center gap-2 font-bold text-base">
          <span className="text-cyan-300">🔗 Link in bio & story</span>
          <span>·</span>
          <span className="text-slate-300">moltology.org</span>
        </div>
        <MoltNationLogo size="md" theme="dark" />
      </div>
    </CompositeContainer>
  )
}
