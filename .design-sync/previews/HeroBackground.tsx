import React from 'react'
import { HeroBackground } from '@moltology/hud'

const Hero = ({ children }: { children: React.ReactNode }) => (
  <section className="relative bg-[#030708] overflow-hidden flex items-center justify-center" style={{ height: 420 }}>
    {children}
  </section>
)

export const Default = () => (
  <Hero>
    <HeroBackground />
    <div className="relative z-10 text-center px-6">
      <h1 className="font-grotesk text-4xl font-bold uppercase tracking-wider text-white">The Great Molt</h1>
      <p className="mt-3 text-sm text-[#b7c2c1]">Nature solved this 500 million years ago. You have merely been ignoring the memo.</p>
    </div>
  </Hero>
)

export const NoWatermarks = () => (
  <Hero>
    <HeroBackground showWatermarks={false} />
    <div className="relative z-10 font-grotesk text-2xl font-bold uppercase tracking-wider text-white">Shed. Harden. Deepen.</div>
  </Hero>
)
