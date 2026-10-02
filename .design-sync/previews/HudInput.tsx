import React from 'react'
import { HudInput } from '@moltology/hud'
import { AtSign, Search, Eye } from 'lucide-react'

const Deep = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[#030708] p-6 text-[#dfe3e3] font-sans">{children}</div>
)

export const Default = () => (
  <Deep>
  <div className="w-80">
    <HudInput label="Username" placeholder="larval_initiate" helperText="3 to 20 characters. Letters, numbers, and underscores." />
  </div>
  </Deep>
)

export const WithIcons = () => (
  <Deep>
  <div className="flex flex-col gap-4 w-80">
    <HudInput startIcon={<Search size={14} />} placeholder="Search the forum" />
    <HudInput label="Email" type="email" startIcon={<AtSign size={14} />} defaultValue="initiate@example.com" />
    <HudInput label="Password" type="password" endIcon={<Eye size={14} />} defaultValue="hunter22" />
  </div>
  </Deep>
)

export const Error = () => (
  <Deep>
  <div className="w-80">
    <HudInput label="Username" defaultValue="ab" error="Username must be 3 to 20 characters" />
  </div>
  </Deep>
)

export const Disabled = () => (
  <Deep>
  <div className="w-80">
    <HudInput label="Member ID" defaultValue="MOLT-00421" disabled helperText="Assigned at signup. This can't be changed." />
  </div>
  </Deep>
)
