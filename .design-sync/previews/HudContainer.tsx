import React from 'react'
import { HudCard, HudContainer, HudCardHeader, HudCardTitle, HudCardContent, HudCardFooter, HudBadge, HudButton } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const Composed = () => (
  <Deep>
    <HudContainer glow className="w-[360px]">
      <HudCardHeader>
        <HudCardTitle>Nightly Molt Audit</HudCardTitle>
        <HudBadge variant="cyan">Tonight</HudBadge>
      </HudCardHeader>
      <HudCardContent>
        <p className="leading-relaxed text-[#b7c2c1]">Name one thing you shed today and one thing you are still carrying. Two lines. No essays.</p>
      </HudCardContent>
      <HudCardFooter>
        <span>Takes about 2 minutes</span>
        <HudButton size="sm">Begin audit</HudButton>
      </HudCardFooter>
    </HudContainer>
  </Deep>
)
