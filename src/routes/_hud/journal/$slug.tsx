import React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, FileText } from 'lucide-react'
import { getJournalPaperBySlug, JOURNAL_META } from '@/lib/journal-data'
import { JournalMasthead } from '@/components/journal/JournalMasthead'
import { JournalPaperReader } from '@/components/journal/JournalPaperReader'

export const Route = createFileRoute('/_hud/journal/$slug')({
  component: JournalPaperPage,
})

function JournalPaperPage() {
  const { slug } = Route.useParams()
  const paper = getJournalPaperBySlug(slug)

  if (!paper) {
    return (
      <div className="space-y-6 font-mono">
        <JournalMasthead variant="compact" />
        <div className="bg-[#0f1414] border border-[#ff5540]/60 p-12 chamfer-corner text-center">
          <FileText className="w-10 h-10 text-[#ff5540] mx-auto mb-4" />
          <h2 className="font-grotesk font-bold text-xl text-[#dfe3e3] uppercase">
            PAPER NOT FOUND
          </h2>
          <p className="text-xs text-[#839493] mt-2 mb-6 font-mono">
            The requested transmission is not present in the canonical archive.
          </p>
          <Link
            to="/journal"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00c3ff] text-[#030606] font-grotesk font-bold text-xs uppercase chamfer-corner"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Journal Archive
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-mono">
      <JournalMasthead variant="compact" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <Link
          to="/journal"
          className="inline-flex items-center gap-2 text-[11px] font-mono font-bold text-[#00c3ff] hover:text-[#38bdf8] uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to The Benthic Compendium
        </Link>
        <span className="text-[9px] font-mono text-[#5f7a7a] uppercase tracking-widest">
          {JOURNAL_META.name} • {paper.paperNumber} • {paper.readTimeMinutes} MIN READ
        </span>
      </div>

      <JournalPaperReader paper={paper} />
    </div>
  )
}
