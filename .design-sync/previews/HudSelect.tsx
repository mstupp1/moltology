import React from 'react'
import { HudSelect } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

const stages = [
  { value: 'larval', label: 'Stage 1 · Larval' },
  { value: 'soft-shed', label: 'Stage 2 · Soft-Shed' },
  { value: 'exoshell', label: 'Stage 3 · Exoshell Born' },
  { value: 'ascendant', label: 'Stage 4 · Full Carcinization', disabled: true },
]

export const Default = () => (
  <Deep><div className="w-80"><HudSelect label="Filter by stage" options={stages} defaultValue="soft-shed" helperText="Shows members at this stage only." /></div></Deep>
)

export const WithChildren = () => (
  <Deep>
    <div className="w-80">
      <HudSelect label="Sort threads" defaultValue="new">
        <option value="new">Newest first</option>
        <option value="top">Most helpful</option>
        <option value="unanswered">Unanswered</option>
      </HudSelect>
    </div>
  </Deep>
)

export const Error = () => (
  <Deep><div className="w-80"><HudSelect label="Forum category" options={[{ value: '', label: 'Choose a category' }, ...stages]} defaultValue="" error="Choose a category before posting" /></div></Deep>
)

export const Disabled = () => (
  <Deep><div className="w-80"><HudSelect label="Region" disabled options={[{ value: 'us', label: 'United States' }]} /></div></Deep>
)
