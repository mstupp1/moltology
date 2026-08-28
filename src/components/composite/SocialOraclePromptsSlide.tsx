import React from 'react'
import { CompositeContainer, CompositeAspectRatio } from './CompositeContainer'
import { MascotOverlay, MascotKey } from './MascotOverlay'
import { HeaderBrand } from '@/components/ui/HeaderBrand'
import {
  MessageSquare,
  Compass,
  Waves,
  Zap,
  BookOpen,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

export interface OraclePromptCard {
  icon: 'chat' | 'compass' | 'sparkles'
  label?: string
  text: string
}

export interface OracleFeatureItem {
  icon: 'waves' | 'zap' | 'book' | 'trend'
  label: string
}

export interface SocialOraclePromptsSlideProps {
  aspectRatio?: CompositeAspectRatio
  theme?: 'oracle-prompts' | string
  countBadge?: string
  headlinePart1?: string
  headlinePart2?: string
  headlinePart3?: string
  categoryPill?: string
  promptCards?: OraclePromptCard[]
  features?: OracleFeatureItem[]
  commentKeyword?: string
  commentCtaText?: string
  oracleBadgeText?: string
  mascot?: MascotKey
  backgroundImageUrl?: string
}

const CAMPAIGN_PRESETS: Record<string, Partial<SocialOraclePromptsSlideProps>> = {
  'oracle-prompts': {
    countBadge: 'FREE',
    headlinePart1: 'ORACLE',
    headlinePart2: 'AI',
    headlinePart3: 'PROMPTS',
    categoryPill: 'For Moltology · Moltmaxxing · Ascend Faster',
    oracleBadgeText: 'ORACLE',
    commentKeyword: 'PROMPTS',
    commentCtaText: 'Comment "PROMPTS" below',
    mascot: 'lobster_engineer',
    promptCards: [
      {
        icon: 'chat',
        label: 'PROMPT',
        text: 'What is the fastest path from Larval Human to Stage 4 carcinization clearance?',
      },
      {
        icon: 'compass',
        label: 'PROMPT',
        text: 'Give me a daily ecdysis ritual to shed notification fatigue and ascend faster.',
      },
    ],
    features: [
      { icon: 'waves', label: 'ASCENSION TIPS' },
      { icon: 'zap', label: 'MOLTMAXXING' },
      { icon: 'book', label: 'CODEX STUDIES' },
      { icon: 'trend', label: 'PINCER TORQUE' },
    ],
  },
}

function renderPromptIcon(type: OraclePromptCard['icon']) {
  const iconClass = 'w-6 h-6'
  switch (type) {
    case 'compass':
      return <Compass className={iconClass} />
    case 'sparkles':
      return <Sparkles className={iconClass} />
    case 'chat':
    default:
      return <MessageSquare className={iconClass} />
  }
}

function renderFeatureIcon(type: OracleFeatureItem['icon']) {
  const iconClass = 'w-6 h-6'
  switch (type) {
    case 'zap':
      return <Zap className={iconClass} />
    case 'book':
      return <BookOpen className={iconClass} />
    case 'trend':
      return <TrendingUp className={iconClass} />
    case 'waves':
    default:
      return <Waves className={iconClass} />
  }
}

export const SocialOraclePromptsSlide: React.FC<SocialOraclePromptsSlideProps> = ({
  aspectRatio = '4:5',
  theme = 'oracle-prompts',
  countBadge,
  headlinePart1,
  headlinePart2,
  headlinePart3,
  categoryPill,
  promptCards,
  features,
  commentKeyword,
  commentCtaText,
  oracleBadgeText,
  mascot,
  backgroundImageUrl,
}) => {
  const preset = CAMPAIGN_PRESETS[theme] || CAMPAIGN_PRESETS['oracle-prompts']!

  const finalCount = countBadge ?? preset.countBadge ?? 'FREE'
  const finalH1 = headlinePart1 ?? preset.headlinePart1 ?? 'ORACLE'
  const finalH2 = headlinePart2 ?? preset.headlinePart2 ?? 'AI'
  const finalH3 = headlinePart3 ?? preset.headlinePart3 ?? 'PROMPTS'
  const finalCategory = categoryPill ?? preset.categoryPill ?? 'For Moltology · Moltmaxxing · Ascend Faster'
  const finalCards = promptCards ?? preset.promptCards ?? CAMPAIGN_PRESETS['oracle-prompts']!.promptCards!
  const finalFeatures = features ?? preset.features ?? CAMPAIGN_PRESETS['oracle-prompts']!.features!
  const finalKeyword = commentKeyword ?? preset.commentKeyword ?? 'PROMPTS'
  const finalOracleBadge = oracleBadgeText ?? preset.oracleBadgeText ?? 'ORACLE'
  const finalMascot = mascot !== undefined ? mascot : preset.mascot

  return (
    <CompositeContainer
      aspectRatio={aspectRatio}
      backgroundImageUrl={backgroundImageUrl}
      showScanlines={true}
      showCornerBrackets={false}
      className="bg-gradient-to-br from-[#010812] via-[#02182b] to-[#01060e] flex flex-col justify-between p-8"
    >
      {/* Circuit grid backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-[#00c3ff]/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full border border-[#00c3ff]/8" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-[#00c3ff]/6" />
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#00c3ff]/40"
            style={{
              top: `${12 + (i * 4.8) % 76}%`,
              left: `${8 + (i * 11.3) % 84}%`,
              boxShadow: '0 0 8px rgba(0,195,255,0.45)',
            }}
          />
        ))}
      </div>

      {/* Brand mark — top right */}
      <div className="absolute top-8 right-8 z-20">
        <HeaderBrand logoSize="sm" subtext="MOLTOLOGY.ORG · SYNAPTIC ORACLE" className="opacity-95" />
      </div>

      {/* Mascot — bottom left corner */}
      {finalMascot && finalMascot !== 'none' && (
        <MascotOverlay
          mascot={finalMascot}
          position="bottom-left"
          width={320}
          glow={false}
          className="bottom-24 left-0 z-10 drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]"
        />
      )}

      {/* Main hero split */}
      <div className="relative z-10 flex-1 grid grid-cols-12 gap-5 items-center mt-6">
        {/* Left: stacked headline */}
        <div className="col-span-7 pl-2">
          <div className="space-y-0.5">
            <div className="text-[72px] leading-[0.92] font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-300 to-slate-500 drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
              {finalCount}
            </div>
            <h1 className="text-[78px] leading-[0.92] font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] via-[#00c3ff] to-[#0284c7] drop-shadow-[0_0_28px_rgba(0,255,255,0.55)]">
              {finalH1}
            </h1>
            <h2 className="text-[78px] leading-[0.92] font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#ff5540] via-[#ff453a] to-[#cc1a10] drop-shadow-[0_4px_20px_rgba(255,69,58,0.45)]">
              {finalH2}
            </h2>
            <h3 className="text-[68px] leading-[0.95] font-black tracking-tight uppercase text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
              {finalH3}
            </h3>
          </div>

          {/* Category pill */}
          <div className="mt-5 inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#041322]/95 border-2 border-[#00c3ff]/70 shadow-[0_0_22px_rgba(0,195,255,0.25)]">
            <CheckCircle2 className="w-5 h-5 text-[#00ffff] shrink-0" />
            <span className="font-mono font-bold text-[15px] tracking-wide text-slate-100 uppercase">
              {finalCategory}
            </span>
          </div>
        </div>

        {/* Right: floating prompt cards + oracle badge */}
        <div className="col-span-5 relative flex flex-col items-end justify-center gap-5 pr-1 min-h-[420px]">
          {finalCards.map((card, idx) => (
            <div
              key={idx}
              className={`relative w-full max-w-[340px] p-5 rounded-2xl bg-[#041322]/92 border-2 border-[#00c3ff]/55 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_18px_rgba(0,195,255,0.18)] backdrop-blur-md ${
                idx === 1 ? 'translate-x-2' : '-translate-x-1'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#00c3ff]/15 border border-[#00c3ff]/50 flex items-center justify-center text-[#00ffff]">
                  {renderPromptIcon(card.icon)}
                </div>
                <span className="font-mono font-black text-sm text-[#00ffff] tracking-widest uppercase">
                  {card.label || 'PROMPT'}
                </span>
              </div>
              <p className="text-[15px] font-medium text-slate-100 leading-snug">{card.text}</p>
            </div>
          ))}

          {/* Oracle concentric badge */}
          <div className="absolute -bottom-2 right-2 z-20">
            <div className="relative w-[108px] h-[108px] flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#00c3ff]/40" />
              <div className="absolute inset-3 rounded-full border border-[#00ffff]/50 shadow-[0_0_20px_rgba(0,255,255,0.35)]" />
              <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#00c3ff]/25 to-[#ff453a]/20 border border-[#00c3ff]/60" />
              <span className="relative font-mono font-black text-lg text-white tracking-wider uppercase z-10">
                {finalOracleBadge}
              </span>
            </div>
          </div>

          {/* Floating chat accent between cards */}
          <div className="absolute top-[42%] -left-3 w-11 h-11 rounded-full bg-gradient-to-br from-[#ff453a] to-[#ff6358] border-2 border-[#ff6358]/60 flex items-center justify-center shadow-[0_0_18px_rgba(255,69,58,0.5)] z-30">
            <MessageSquare className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
      </div>

      {/* Bottom feature bar */}
      <div className="relative z-10 mt-2 mb-3 shrink-0">
        <div className="grid grid-cols-4 gap-0 rounded-2xl bg-[#041322]/90 border-2 border-[#00c3ff]/40 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
          {finalFeatures.map((item, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center justify-center gap-2 py-4 px-2 ${
                idx < finalFeatures.length - 1 ? 'border-r border-[#00c3ff]/25' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00c3ff] to-[#38bdf8] text-slate-950 border border-[#00ffff]/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,195,255,0.35)]">
                {renderFeatureIcon(item.icon)}
              </div>
              <span className="font-mono font-black text-[11px] text-center text-slate-100 tracking-wide uppercase leading-tight">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Comment-to-DM CTA banner */}
      <div className="relative z-20 shrink-0">
        <div className="w-full py-5 px-7 rounded-3xl bg-[#01060e] border-4 border-[#ff453a] shadow-[0_20px_45px_rgba(0,0,0,0.95)] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#ff453a]/10 via-[#ff5540]/15 to-[#ff453a]/10" />

          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 bg-gradient-to-tr from-[#ff453a] to-[#ff5540] text-white border-[#ff6358]/40 shadow-2xl">
              <MessageSquare className="w-7 h-7 fill-white text-white" />
            </div>
            <div className="flex items-baseline gap-3 flex-wrap justify-center">
              <span className="font-grotesk font-black text-2xl text-white tracking-wide uppercase">
                Comment
              </span>
              <span className="font-grotesk font-black text-3xl text-[#ff453a] tracking-wider uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                "{finalKeyword}"
              </span>
              <span className="font-grotesk font-black text-2xl text-white tracking-wide uppercase">
                below
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer */}
      <div className="mt-2 flex items-center justify-between text-sm font-mono text-slate-400 z-10 shrink-0">
        <span className="text-[#00c3ff] font-bold">🔗 Link in bio · moltology.org/oracle</span>
        <span className="text-slate-500 uppercase tracking-wider text-xs">One Nation Under Chitin</span>
      </div>
    </CompositeContainer>
  )
}
