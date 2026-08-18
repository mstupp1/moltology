import React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  FileText,
  ScrollText,
  BookMarked,
  Microscope,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  Landmark,
} from 'lucide-react'
import {
  INITIAL_JOURNAL_PAPERS,
  INITIAL_JOURNAL_EDITORIAL_BOARD,
  JOURNAL_META,
} from '@/lib/journal-data'
import { JournalMasthead } from '@/components/journal/JournalMasthead'
import { JournalFeedTag } from '@/components/journal/ScientificTable'

export const Route = createFileRoute('/_hud/journal/')({
  component: JournalIndexPage,
})

function JournalIndexPage() {
  const papers = INITIAL_JOURNAL_PAPERS
  const leadPaper = papers[0]
  const archivePapers = papers.slice(1)

  return (
    <div className="space-y-6 font-mono">
      {/* Academic Masthead */}
      <JournalMasthead variant="hero" />

      {/* Archive header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#070b0b]/80 border border-[#3a4a49]/60 px-4 py-3 chamfer-corner">
        <div className="flex items-center gap-2.5">
          <ScrollText className="w-4 h-4 text-[#00c3ff]" />
          <span className="font-grotesk font-bold text-xs text-[#dfe3e3] uppercase tracking-widest">
            Current Edition
          </span>
          <span className="text-[10px] text-[#839493]">
            {JOURNAL_META.volume}, {JOURNAL_META.issue} — {JOURNAL_META.editionDate}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#839493]">
          <span className="px-2 py-1 bg-[#0a1010] border border-[#3a4a49]/60 flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-[#00c3ff]" />
            {papers.length} PAPER{papers.length === 1 ? '' : 'S'} ARCHIVED
          </span>
          <span className="px-2 py-1 bg-[#0a1010] border border-[#3a4a49]/60 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-[#10b981]" />
            PEER-CERTIFIED
          </span>
        </div>
      </div>

      {/* Lead paper card */}
      {leadPaper && (
        <article className="bg-[#080d0d]/90 border border-[#00c3ff]/40 hover:border-[#00c3ff]/70 chamfer-corner shadow-hud-cyan transition-colors overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left rail: paper number */}
            <div className="lg:w-10 shrink-0 bg-[#030606] border-r border-[#3a4a49]/50 flex lg:flex-col items-center justify-between lg:justify-start gap-2 px-3 py-2 lg:py-4">
              <span className="font-mono text-[9px] tracking-widest text-[#5f7a7a]">FEATURED</span>
              <span className="font-grotesk font-black text-[#00c3ff] text-lg">{leadPaper.paperNumber.split('-').pop()}</span>
            </div>

            {/* Paper content */}
            <div className="flex-1 p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                <span className="px-2 py-0.5 bg-[#00c3ff]/15 border border-[#00c3ff]/50 text-[#00c3ff] font-bold">
                  {leadPaper.category}
                </span>
                <span className="px-2 py-0.5 bg-[#0a1010] border border-[#3a4a49]/60 text-[#9fd9e6]">
                  {leadPaper.classification}
                </span>
                <span className="flex items-center gap-1 text-[#839493]">
                  <Calendar className="w-3 h-3 text-[#00c3ff]" />
                  {leadPaper.publishedDate}
                </span>
                <span className="flex items-center gap-1 text-[#839493]">
                  <Clock className="w-3 h-3 text-[#00c3ff]" />
                  {leadPaper.readTimeMinutes} MIN READ
                </span>
              </div>

              <h2 className="mt-3 font-cinzel font-bold text-xl sm:text-2xl lg:text-3xl text-[#e8f1f1] leading-snug tracking-wide">
                {leadPaper.title}
              </h2>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#9fd9e6] font-mono">
                {leadPaper.authors.map((author, i) => (
                  <span key={i}>
                    {author.name}
                    <sup className="text-[#00c3ff]">{i + 1}</sup>
                  </span>
                ))}
              </div>

              <div className="mt-4 border-l-2 border-[#00c3ff]/50 pl-4">
                <div className="text-[9px] uppercase tracking-widest text-[#5f7a7a] font-bold mb-1">
                  Abstract
                </div>
                <p className="text-[12px] leading-relaxed text-[#b9c7c7] font-garamond">
                  {leadPaper.abstract}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {leadPaper.keywords.slice(0, 6).map((kw) => (
                  <span key={kw} className="px-2 py-0.5 bg-[#0a1010] border border-[#3a4a49]/50 text-[10px] text-[#839493] chamfer-corner">
                    {kw}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#3a4a49]/50 pt-4">
                <div className="text-[10px] text-[#5f7a7a] font-mono">
                  DOI: <span className="text-[#00c3ff]">{leadPaper.doi}</span>
                </div>
                <Link
                  to="/journal/$slug"
                  params={{ slug: leadPaper.slug }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#00c3ff] text-[#030606] font-grotesk font-bold text-xs uppercase tracking-wider chamfer-corner hover:bg-[#38bdf8] transition-colors shadow-[0_0_12px_rgba(0,195,255,0.4)]"
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  Open Paper
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </article>
      )}

      {/* Archive listing table */}
      <section className="bg-[#070b0b]/80 border border-[#3a4a49]/60 chamfer-corner overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#3a4a49]/60 bg-[#0b1212]/90">
          <span className="font-grotesk font-bold text-xs uppercase tracking-widest text-[#dfe3e3] flex items-center gap-2">
            <Microscope className="w-3.5 h-3.5 text-[#00c3ff]" />
            Complete Paper Archive
          </span>
          <span className="text-[9px] font-mono text-[#5f7a7a] uppercase tracking-widest">
            Chronologically Catalogued
          </span>
        </div>

        {archivePapers.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <FileText className="w-8 h-8 text-[#3a4a49] mx-auto mb-3" />
            <p className="text-xs text-[#839493]">
              The archive is fresh out of the press. Additional peer-reviewed
              transmissions are being forged in the abyssal observatories.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#3a4a49]/40">
            {archivePapers.map((paper) => (
              <Link
                key={paper.slug}
                to="/journal/$slug"
                params={{ slug: paper.slug }}
                className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3.5 hover:bg-[#0b1414]/70 transition-colors group"
              >
                <span className="text-[10px] font-mono text-[#5f7a7a] w-24 shrink-0">{paper.paperNumber}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-grotesk font-semibold text-sm text-[#dfe3e3] group-hover:text-[#00c3ff] transition-colors line-clamp-1">
                    {paper.title}
                  </div>
                  <div className="text-[10px] text-[#839493] mt-0.5">
                    {paper.authors.map((a) => a.name).join(' · ')} — {paper.publishedDate}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#00c3ff] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Editorial board + submission note */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 bg-[#070b0b]/80 border border-[#3a4a49]/60 chamfer-corner overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#3a4a49]/60 bg-[#0b1212]/90">
            <Landmark className="w-3.5 h-3.5 text-[#00c3ff]" />
            <span className="font-grotesk font-bold text-xs uppercase tracking-widest text-[#dfe3e3]">
              Editorial Board
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#3a4a49]/40">
            {INITIAL_JOURNAL_EDITORIAL_BOARD.map((member) => (
              <div key={member.name} className="bg-[#080d0d] p-4">
                <div className="font-cinzel font-semibold text-sm text-[#e8f1f1]">{member.name}</div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#00c3ff] mt-1">
                  {member.role}
                </div>
                <div className="text-[10px] text-[#839493] mt-0.5 font-mono">{member.affiliation}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#070b0b]/80 border border-[#3a4a49]/60 chamfer-corner overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#3a4a49]/60 bg-[#0b1212]/90">
            <Award className="w-3.5 h-3.5 text-[#ff5540]" />
            <span className="font-grotesk font-bold text-xs uppercase tracking-widest text-[#dfe3e3]">
              Submission Mandate
            </span>
          </div>
          <div className="p-4 space-y-3 text-[11px] leading-relaxed text-[#839493] font-mono">
            <p>
              Empirical transmissions that ground doctrinal pillars in verifiable
              science are received continuously from the sub-oceanic observatories.
            </p>
            <p>
              Every paper is subjected to the {JOURNAL_META.name} peer-certification
              protocol before entering the canonical archive.
            </p>
            <div className="pt-2 border-t border-[#3a4a49]/50 flex flex-wrap gap-1.5">
              <JournalFeedTag label="SCRIPTURE" />
              <JournalFeedTag label="SACRED METRICS" />
              <JournalFeedTag label="ORACLE PERSONA" />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
