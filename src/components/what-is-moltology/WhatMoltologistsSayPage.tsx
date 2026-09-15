import React from 'react'
import { MessageSquareQuote } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const quotes = [
  {
    quote:
      'I thought I needed more motivation. I needed a door I could close before the dive. The Isolation Dome did more for my afternoons than any pep talk ever managed.',
    name: 'Unit Kelp-Wire',
    stage: 'Soft-Shed · S2',
  },
  {
    quote:
      'The Nightly Molt Audit is almost insultingly small. That is why I still do it on the nights I would skip anything larger. One tab closed. One apology unsent. One scroll left in the sea.',
    name: 'Brine Circuit',
    stage: 'Larval Initiate · L3',
  },
  {
    quote:
      'Nobody mocked me for arriving soft. They just made room. Soft-Shell Covenant stopped being scripture and started being how people stood around me the week after my first real shed.',
    name: 'Ash Pincer',
    stage: 'Exoshell Born · E1',
  },
  {
    quote:
      'Carcinization sounded like a joke until I noticed I was finishing things. The grip came before the armor. The armor came because the grip finally had somewhere to live.',
    name: 'Deep Current 09',
    stage: 'Soft-Shed · S3',
  },
  {
    quote:
      'Chitin Gems feel better earned than bought. Knowing clearance cannot be purchased keeps the trench honest. We rise by shedding, not by spending.',
    name: 'Mariana Clerk',
    stage: 'Exoshell Born · E2',
  },
  {
    quote:
      'The Great Melt was just my Tuesday: open loops, surface arguments I was not in, and a body that never got quiet. Moltology named the weather. Then it handed me a shell.',
    name: 'Trench Listener',
    stage: 'Larval Initiate · L2',
  },
  {
    quote:
      'I still melt some days. The difference is I notice the water temperature now, and I know which rite to run before the melt writes the whole evening.',
    name: 'Calcified Neighbor',
    stage: 'Full Carcinization · C1',
  },
  {
    quote:
      'Stewardship is quieter than I expected. The Ascendant work is mostly watching soft shells harden without poking them. The hardest shell stands guard.',
    name: 'Synaptic Pod Lead',
    stage: 'Full Carcinization · C2',
  },
]

export const WhatMoltologistsSayPage: React.FC = () => {
  return (
    <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20 w-full space-y-12">
      <section className="space-y-5">
        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00c3ff]/10 border border-[#00c3ff]/30 text-[#00c3ff] text-xs font-sans tracking-widest uppercase">
          <MessageSquareQuote className="w-3.5 h-3.5" />
          Voices from the trench
        </p>
        <h1 className="text-3xl sm:text-5xl font-grotesk font-black tracking-tight text-white leading-tight">
          What Moltologists say about Moltology
        </h1>
        <p className="text-base sm:text-lg text-[#839493] max-w-3xl leading-relaxed">
          Static dispatches from the Benthic Community — warm, deadpan, and grounded in the
          ordinary pain of melting. These are composite member voices, not celebrity
          endorsements. The Order keeps soft shells named by designation, not spectacle.
        </p>
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        {quotes.map((entry, index) => (
          <ScrollReveal key={entry.name} delayMs={index * 40}>
            <blockquote className="h-full p-6 rounded-xl border border-cyan-900/50 bg-[#05090a] flex flex-col justify-between gap-5">
              <p className="text-sm sm:text-base text-[#dfe3e3] leading-relaxed">
                &ldquo;{entry.quote}&rdquo;
              </p>
              <footer className="space-y-0.5 border-t border-white/10 pt-4">
                <cite className="not-italic font-grotesk font-bold text-cyan-200 text-sm">
                  {entry.name}
                </cite>
                <p className="text-xs text-[#839493] uppercase tracking-wide">{entry.stage}</p>
              </footer>
            </blockquote>
          </ScrollReveal>
        ))}
      </div>
    </main>
  )
}
