import React from 'react'
import { HudCard, HudCardHeader, HudCardTitle, HudCardContent, HudCardFooter, HudBadge, HudButton } from '@moltology/hud'

const Deep = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[#030708] p-6 text-[#dfe3e3] font-sans">{children}</div>
)

export const Composed = () => (
  <Deep>
  <HudCard glow className="w-[360px]">
    <HudCardHeader>
      <HudCardTitle>Daily Shedding Routine</HudCardTitle>
      <HudBadge variant="emerald" dot>Active</HudBadge>
    </HudCardHeader>
    <HudCardContent>
      <p className="leading-relaxed text-[#b7c2c1]">
        Close the forty-seven open tabs. Silence one notification channel. Finish the thing you started yesterday.
        Nature solved this 500 million years ago. You have merely been ignoring the memo.
      </p>
    </HudCardContent>
    <HudCardFooter>
      <span>3 of 5 sheds complete</span>
      <HudButton size="sm">Log a shed</HudButton>
    </HudCardFooter>
  </HudCard>
  </Deep>
)

const Body = ({ title, text }: { title: string; text: string }) => (
  <>
    <HudCardHeader><HudCardTitle>{title}</HudCardTitle></HudCardHeader>
    <HudCardContent><p className="leading-relaxed">{text}</p></HudCardContent>
  </>
)

export const Variants = () => (
  <Deep>
  <div className="grid grid-cols-2 gap-4 w-[560px]">
    <HudCard variant="teal"><Body title="Teal" text="Default panel for most content." /></HudCard>
    <HudCard variant="cyan"><Body title="Cyan" text="Highlighted or focused panel." /></HudCard>
    <HudCard variant="crimson"><Body title="Crimson" text="Warnings and sacred doctrine." /></HudCard>
    <HudCard variant="dark"><Body title="Dark" text="Quiet secondary surface." /></HudCard>
    <HudCard variant="ghost" className="col-span-2"><Body title="Ghost" text="Outline only. Sits on busy backgrounds." /></HudCard>
  </div>
  </Deep>
)

export const CornerBrackets = () => (
  <Deep>
  <HudCard variant="cyan" showCornerBrackets glow className="w-[320px]">
    <HudCardContent>
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#839493]">Shell Hardness</div>
      <div className="mt-1 text-2xl font-bold text-[#00c3ff]">61%</div>
      <div className="mt-1 text-[#839493]">Stage 3 · Exoshell Born</div>
    </HudCardContent>
  </HudCard>
  </Deep>
)

export const Textured = () => (
  <Deep>
  <div className="grid grid-cols-3 gap-3 w-[540px]">
    {(['chitin', 'hex', 'alloy', 'carbon', 'basalt', 'circuit'] as const).map((t) => (
      <HudCard key={t} variant="dark" texture={t} className="h-24">
        <HudCardContent className="uppercase tracking-wider font-bold">{t}</HudCardContent>
      </HudCard>
    ))}
  </div>
  </Deep>
)

export const Interactive = () => (
  <Deep>
  <HudCard interactive className="w-[320px]">
    <HudCardHeader><HudCardTitle>Abyssal Depth</HudCardTitle></HudCardHeader>
    <HudCardContent>Deep focus. Drop below the noise. Hover to lift the panel.</HudCardContent>
  </HudCard>
  </Deep>
)
