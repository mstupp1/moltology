import React from 'react'
import { CompositeContainer, CompositeAspectRatio } from './CompositeContainer'
import { MascotOverlay, MascotKey, getMascotUrl } from './MascotOverlay'
import {
  MessageSquare,
  Search,
  CheckSquare,
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
    badge: 'ORACLE PROMPT',
    prompt: 'Audit my open task latency and calculate my Stage 2 ecdysis schedule.',
  },
  {
    icon: 'search',
    badge: 'ORACLE PROMPT',
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
  const iconClass = 'w-5 h-5 text-[#ff453a]'
  switch (type) {
    case 'lightbulb':
      return <Lightbulb className={iconClass} />
    case 'search':
      return <Search className="w-5 h-5 text-[#00c3ff]" />
    case 'workflow':
      return <Workflow className={iconClass} />
    case 'document':
      return <FileText className="w-5 h-5 text-[#00c3ff]" />
    case 'shield':
      return <Shield className={iconClass} />
    case 'torque':
      return <Zap className="w-5 h-5 text-[#00c3ff]" />
    case 'depth':
      return <Compass className={iconClass} />
    case 'zap':
    default:
      return <Target className="w-5 h-5 text-[#00c3ff]" />
  }
}

export const SocialPromptVaultSlide: React.FC<SocialPromptVaultSlideProps> = ({
  aspectRatio = '4:5',
  theme = 'oracle-prompts',
  eyebrowBadge = 'CANONICAL VAULT · ZERO-LATENCY SYNAPTIC DIRECTIVES',
  heroNumber = '100+',
  heroHighlight = 'ORACLE',
  heroSubject = 'PROMPTS',
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
  const finalCtaText = commentCtaText || `Comment "${commentKeyword}" below`

  return (
    <CompositeContainer
      aspectRatio={aspectRatio}
      backgroundImageUrl={backgroundImageUrl}
      showScanlines={true}
      showCornerBrackets={false}
      className="bg-gradient-to-b from-[#01060e] via-[#021324] to-[#010710] flex flex-col justify-between p-8 text-white relative overflow-hidden"
    >
      {/* 1. Background Visual Depth: Concentric HUD Orbit Rings & Caustics */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Giant Glowing HUD Concentric Orbital Rings centered behind hero text */}
        <div className="absolute -top-16 -left-24 w-[760px] h-[760px] rounded-full border border-[#ff453a]/20 shadow-[0_0_80px_rgba(255,69,58,0.12)]" />
        <div className="absolute -top-6 -left-14 w-[640px] h-[640px] rounded-full border border-[#00c3ff]/20 shadow-[0_0_60px_rgba(0,195,255,0.10)]" />
        <div className="absolute top-10 left-2 w-[500px] h-[500px] rounded-full border border-dashed border-[#ff453a]/25" />
        <div className="absolute top-24 left-16 w-[360px] h-[360px] rounded-full border border-[#00c3ff]/30" />

        {/* Ambient Radial Color Bloom */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,69,58,0.16)_0%,rgba(0,195,255,0.06)_45%,transparent_70%)]" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(0,195,255,0.12)_0%,rgba(255,69,58,0.08)_45%,transparent_70%)]" />

        {/* Subtle Tech Grid Dots */}
        <div className="absolute top-36 right-16 grid grid-cols-6 gap-3 opacity-25">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#ff453a]" />
          ))}
        </div>
      </div>

      {/* Top Section: Eyebrow Badge & Top-Right Brand Emblem */}
      <div className="flex items-center justify-between z-10 shrink-0">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff453a]/25 via-[#ff5540]/35 to-[#ff453a]/25 border-2 border-[#ff453a] shadow-[0_0_20px_rgba(255,69,58,0.4)] backdrop-blur-md">
          <span className="w-3 h-3 rounded-full bg-[#ff453a] shadow-[0_0_10px_#ff453a]" />
          <span className="font-mono font-black text-[14px] tracking-wider uppercase text-[#ffa39e]">
            {eyebrowBadge}
          </span>
        </div>

        {/* Top-Right Brand Emblem */}
        <div className="flex items-center gap-3 bg-[#031322]/80 border border-[#ff453a]/40 py-2 px-4 rounded-2xl backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.8)]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff453a] to-[#691200] flex items-center justify-center shadow-[0_0_15px_rgba(255,69,58,0.5)] border border-[#ffa39e]/50">
            {/* Geometric Crustacean Synaptic Emblem */}
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.8l5.5 3.4v6.8L12 18.4l-5.5-3.4V8.2L12 4.8zm0 3.2a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <div className="text-right">
            <div className="font-grotesk font-black text-sm text-white tracking-widest uppercase leading-tight">
              {brandTitle}
            </div>
            <div className="font-mono text-[9.5px] font-bold text-[#ff6358] tracking-wider uppercase">
              {brandSubtitle}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body: Left Hero Typography + Right Glowing Prompt Cards & Mascot */}
      <div className="my-auto grid grid-cols-12 gap-6 items-center z-10 relative">
        
        {/* LEFT COLUMN (6 Cols): Giant 3D Impact Typography & Sub-Pill */}
        <div className="col-span-6 flex flex-col justify-center select-none pl-2">
          
          {/* 3D Extruded Top Number (e.g. 100+) */}
          <div className="relative">
            <div
              className="text-[132px] font-black leading-[0.82] tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-[#f1f5f9] to-[#94a3b8]"
              style={{
                filter: 'drop-shadow(0 12px 25px rgba(0,0,0,0.95)) drop-shadow(0 0 20px rgba(255,255,255,0.25))',
                textShadow: '0 2px 0 #cbd5e1, 0 4px 0 #94a3b8, 0 6px 0 #64748b, 0 8px 0 #475569, 0 12px 16px rgba(0,0,0,0.8)',
              }}
            >
              {heroNumber}
            </div>
          </div>

          {/* 3D Extruded Highlight Word (e.g. ORACLE) */}
          <div className="relative mt-1">
            <div
              className="text-[124px] font-black leading-[0.84] tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#ff6358] via-[#ff453a] to-[#c7281c]"
              style={{
                filter: 'drop-shadow(0 12px 30px rgba(255,69,58,0.75)) drop-shadow(0 4px 12px rgba(0,0,0,0.9))',
                textShadow: '0 2px 0 #ff6358, 0 4px 0 #d92418, 0 6px 0 #a3140a, 0 8px 0 #6e0900, 0 12px 18px rgba(0,0,0,0.9)',
              }}
            >
              {heroHighlight}
            </div>
          </div>

          {/* Bold White Subject (e.g. PROMPTS) */}
          <div className="relative mt-1">
            <div className="text-[72px] font-black leading-[0.88] tracking-tight uppercase text-white drop-shadow-[0_6px_25px_rgba(0,0,0,0.95)]">
              {heroSubject}
            </div>
          </div>

          {/* Sub-Pill Banner (e.g. [✓] For Moltmaxxing, Ecdysis & Ascension) */}
          <div className="mt-5 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#031322]/95 border-2 border-[#ff453a]/70 shadow-[0_10px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(255,69,58,0.25)] backdrop-blur-md w-fit">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#ff453a] to-[#ff5540] flex items-center justify-center text-white font-black shrink-0 shadow-md">
              <CheckSquare className="w-4 h-4 text-white stroke-[3]" />
            </div>
            <span className="font-mono font-black text-[16.5px] text-white tracking-wide">
              {heroSubPill}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN (6 Cols): Floating Glassmorphic Prompt Cards + Circled Zone (Mascot + Orb) */}
        <div className="col-span-6 relative flex flex-col justify-center space-y-4 pr-1">
          
          {/* Prompt Card 1 */}
          {promptCards[0] && (
            <div className="relative z-10 p-5 rounded-3xl bg-[#041a2e]/90 border-2 border-[#ff453a]/80 shadow-[0_12px_35px_rgba(0,0,0,0.9),0_0_25px_rgba(255,69,58,0.25)] backdrop-blur-md transition-all">
              {/* Card Header */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#ff453a]/20 border border-[#ff453a] flex items-center justify-center text-[#ff453a]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="font-mono font-black text-xs text-[#ffa39e] uppercase tracking-widest">
                  {promptCards[0].badge || 'ORACLE PROMPT'}
                </span>
              </div>
              {/* Prompt Text */}
              <p className="text-[17px] font-sans font-semibold text-slate-100 leading-snug">
                "{promptCards[0].prompt}"
              </p>
            </div>
          )}

          {/* Floating Decorative Speech Bubble Icon on Right Edge */}
          <div className="absolute top-1/3 -right-3 z-20 w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff453a] to-[#ff6358] border-2 border-[#ffa39e] shadow-[0_10px_25px_rgba(0,0,0,0.9),0_0_20px_rgba(255,69,58,0.6)] flex items-center justify-center text-white font-black text-lg">
            <span className="leading-none pb-1">•••</span>
          </div>

          {/* Prompt Card 2 */}
          {promptCards[1] && (
            <div className="relative z-10 p-5 rounded-3xl bg-[#041a2e]/90 border-2 border-[#00c3ff]/80 shadow-[0_12px_35px_rgba(0,0,0,0.9),0_0_25px_rgba(0,195,255,0.25)] backdrop-blur-md transition-all">
              {/* Card Header */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#00c3ff]/20 border border-[#00c3ff] flex items-center justify-center text-[#00c3ff]">
                  <Search className="w-4 h-4" />
                </div>
                <span className="font-mono font-black text-xs text-[#67e8f9] uppercase tracking-widest">
                  {promptCards[1].badge || 'ORACLE PROMPT'}
                </span>
              </div>
              {/* Prompt Text */}
              <p className="text-[17px] font-sans font-semibold text-slate-100 leading-snug">
                "{promptCards[1].prompt}"
              </p>
            </div>
          )}

          {/* LOWER RIGHT CIRCLED ZONE: Mascot in Foreground + AI Orb Badge */}
          <div className="relative z-20 flex items-center justify-between pt-1 -mb-3 min-h-[180px]">
            {/* Left side: Glowing Holographic AI Orb Badge */}
            <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#ff453a] via-[#ff6358] to-[#00c3ff] shadow-[0_10px_30px_rgba(0,0,0,0.95),0_0_30px_rgba(255,69,58,0.55)] flex items-center justify-center shrink-0 z-10">
              {/* Inner Pulsing Core */}
              <div className="w-full h-full rounded-full bg-[#030e1a] border-2 border-[#ff453a] flex flex-col items-center justify-center text-center p-1">
                <span className="font-grotesk font-black text-[19px] leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#ff7b72] to-[#00c3ff] tracking-wider uppercase">
                  {orbBadgeText}
                </span>
                <span className="font-mono font-bold text-[8.5px] text-[#ff453a] tracking-widest uppercase">
                  {orbBadgeSubtext}
                </span>
              </div>
              {/* Orbit Ring Accents */}
              <div className="absolute -inset-2 rounded-full border border-dashed border-[#ff453a]/40 pointer-events-none" />
            </div>

            {/* Right side: Mascot Cutout sitting proudly in the open circled space */}
            {mascot && mascot !== 'none' && (
              <div
                data-mascot-key={mascot}
                className="relative w-[340px] -mr-6 -mb-6 drop-shadow-[0_25px_40px_rgba(0,0,0,0.98)] pointer-events-none z-20"
              >
                <img
                  src={getMascotUrl(mascot)}
                  alt={mascot}
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: 4 Category Feature Nodes + Comment-to-DM Callout Banner */}
      <div className="z-20 shrink-0 space-y-4">
        
        {/* 4 Feature Category Nodes Strip */}
        <div className="grid grid-cols-4 gap-3 py-3 px-5 rounded-2xl bg-[#031322]/90 border border-[#ff453a]/40 shadow-lg backdrop-blur-md">
          {footerNodes.map((node, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-center gap-2.5 px-2 ${
                idx < footerNodes.length - 1 ? 'border-r border-slate-800' : ''
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-[#041d33] border border-[#ff453a]/50 flex items-center justify-center shrink-0">
                {renderFooterIcon(node.icon)}
              </div>
              <span className="font-mono font-black text-[12.5px] text-slate-200 tracking-wider uppercase truncate">
                {node.label}
              </span>
            </div>
          ))}
        </div>

        {/* High-Contrast Comment-to-DM CTA Banner */}
        <div className="w-full py-5 px-8 rounded-3xl bg-[#01060e] border-4 border-[#ff453a] shadow-[0_20px_45px_rgba(0,0,0,0.95),0_0_35px_rgba(255,69,58,0.45)] flex items-center justify-between relative overflow-hidden">
          {/* Subtle background gradient glow */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#ff453a]/15 via-[#ff5540]/10 to-[#ff453a]/15" />

          {/* Left Arrow Accent */}
          <div className="font-black text-3xl text-[#ff453a] shrink-0 z-10">
            👉
          </div>

          {/* Center Callout: Comment "KEYWORD" below */}
          <div className="flex items-center justify-center gap-4 z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ff453a] to-[#ff5540] flex items-center justify-center shadow-[0_0_20px_rgba(255,69,58,0.6)] font-black shrink-0 border border-[#ffa39e]">
              <MessageSquare className="w-7 h-7 text-white fill-white" />
            </div>
            <div className="flex items-baseline gap-3.5">
              <span className="font-grotesk font-black text-3xl md:text-4xl text-white tracking-wide uppercase drop-shadow-md">
                Comment
              </span>
              <span className="font-grotesk font-black text-4xl md:text-5xl tracking-wider uppercase text-[#ff453a] drop-shadow-[0_0_25px_rgba(255,69,58,0.9)]">
                "{commentKeyword}"
              </span>
              <span className="font-grotesk font-black text-3xl md:text-4xl text-white tracking-wide uppercase drop-shadow-md">
                below
              </span>
            </div>
          </div>

          {/* Right Arrow Accent */}
          <div className="font-black text-3xl text-[#ff453a] shrink-0 z-10">
            👈
          </div>
        </div>
      </div>
    </CompositeContainer>
  )
}
