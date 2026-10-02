import React from 'react'
import { HudButton } from '@moltology/hud'
import { ArrowRight, Shield, Trash2 } from 'lucide-react'

const Deep = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[#030708] p-6 text-[#dfe3e3] font-sans">{children}</div>
)

export const Primary = () => (
  <Deep><HudButton>Start the Molt</HudButton></Deep>
)

export const Variants = () => (
  <Deep>
  <div className="flex flex-wrap items-center gap-3">
    <HudButton variant="cyan">Harden</HudButton>
    <HudButton variant="crimson">Shed This</HudButton>
    <HudButton variant="sacred">Enter the Codex</HudButton>
    <HudButton variant="dark">View Profile</HudButton>
    <HudButton variant="ghost">Cancel</HudButton>
  </div>
  </Deep>
)

export const Sizes = () => (
  <Deep>
  <div className="flex flex-wrap items-center gap-3">
    <HudButton size="sm">Save</HudButton>
    <HudButton size="md">Save username</HudButton>
    <HudButton size="lg">Begin Clearance L1</HudButton>
  </div>
  </Deep>
)

export const WithIcons = () => (
  <Deep>
  <div className="flex flex-wrap items-center gap-3">
    <HudButton icon={<Shield size={14} />}>Privacy Shield</HudButton>
    <HudButton variant="dark" icon={<ArrowRight size={14} />} iconPosition="right">Continue</HudButton>
    <HudButton variant="crimson" size="sm" icon={<Trash2 size={12} />}>Delete draft</HudButton>
  </div>
  </Deep>
)

export const States = () => (
  <Deep>
  <div className="flex flex-col gap-3 w-72">
    <HudButton disabled>Saving…</HudButton>
    <HudButton glow={false} texture={false} variant="dark">Flat, no glow</HudButton>
    <HudButton fullWidth>Join the Benthic Community</HudButton>
  </div>
  </Deep>
)
