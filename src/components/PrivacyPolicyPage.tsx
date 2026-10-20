import React, { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Shield } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { MainFooter } from '@/components/MainFooter'

import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_UPDATED } from './privacy-policy-content'

const CURRENT_YEAR = 2026

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({
  id,
  title,
  children,
}) => (
  <section id={id} className="mb-12 scroll-mt-24">
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-cyan-900/40">
      <h2 className="text-sm font-bold text-cyan-300 tracking-widest uppercase">{title}</h2>
    </div>
    <div className="text-sm text-gray-400 leading-relaxed space-y-3">{children}</div>
  </section>
)

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0f0f] text-[#dfe3e3] font-sans">
      <PublicHeader />

      {/* Hero */}
      <div className="relative pt-28 pb-12 px-6 text-center border-b border-cyan-950/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,255,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="inline-flex items-center gap-2 bg-cyan-950/40 border border-cyan-800/40 rounded-full px-4 py-1.5 text-[10px] text-cyan-400 tracking-widest uppercase mb-6">
          <Shield className="w-3 h-3" />
          <span>Moltology privacy</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-gray-500 max-w-xl mx-auto">
          Moltology &nbsp;|&nbsp; Last updated: {PRIVACY_UPDATED}
        </p>
      </div>

      {/* Layout */}
      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-10">
        {/* Sticky sidebar TOC */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="sticky top-24 space-y-1 text-[10px] text-gray-500 tracking-widest uppercase">
            <p className="text-cyan-500 font-bold mb-3">Contents</p>
            {PRIVACY_SECTIONS.map(({ id, title }) => (
              <a
                key={id}
                href={`#${id}`}
                className="block py-1 hover:text-cyan-400 transition-colors"
              >
                {title}
              </a>
            ))}
          </div>
        </aside>

        {/* Body */}
        <article className="flex-1 min-w-0">
          <p className="text-sm text-gray-400 mb-10 leading-relaxed">{PRIVACY_INTRO}</p>
          {PRIVACY_SECTIONS.map(({ id, title, paragraphs, links }) => (
            <Section key={id} id={id} title={title}>
              {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {links?.map(({ label, href }) => (
                <p key={href}>
                  <a href={href} className="text-cyan-400 underline underline-offset-4">{label}</a>
                </p>
              ))}
            </Section>
          ))}

          <div className="mt-4 pt-6 border-t border-cyan-950/60 text-[10px] text-gray-600">
            © {CURRENT_YEAR} Moltology. Last updated: {PRIVACY_UPDATED}
          </div>
        </article>
      </div>

      {/* Back button */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 text-xs text-cyan-500 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to home
        </button>
      </div>

      <MainFooter />
    </div>
  )
}
