import React, { useState } from 'react'
import { Slider } from '@moltology/hud'

const Deep = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#030708] p-6 text-[#dfe3e3] font-sans ${className}`}>{children}</div>
)

export const WithReadout = () => {
  const [v, setV] = useState([25])
  return (
    <Deep>
      <div className="w-80 flex flex-col gap-3">
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-[#839493]">
          <span>Daily focus goal</span><span className="text-[#00c3ff]">{v[0]} min</span>
        </div>
        <Slider value={v} onValueChange={setV} min={5} max={120} step={5} aria-label="Daily focus goal" />
      </div>
    </Deep>
  )
}

export const Stepped = () => {
  const [v, setV] = useState([3])
  return (
    <Deep>
      <div className="w-80 flex flex-col gap-3">
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-[#839493]">
          <span>Sheds per day</span><span className="text-[#00c3ff]">{v[0]}</span>
        </div>
        <Slider value={v} onValueChange={setV} min={1} max={10} step={1} aria-label="Sheds per day" />
      </div>
    </Deep>
  )
}

export const Disabled = () => (
  <Deep><div className="w-80"><Slider defaultValue={[60]} disabled aria-label="Volume" /></div></Deep>
)
