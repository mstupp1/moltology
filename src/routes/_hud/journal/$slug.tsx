import React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, FileText } from 'lucide-react'
import { getJournalPaperBySlug, INITIAL_JOURNAL_PAPERS } from '@/lib/journal-data'
import { JournalReaderWorkspace } from '@/components/journal/JournalReaderWorkspace'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

export const Route = createFileRoute('/_hud/journal/$slug')({
  component: JournalPaperPage,
  pendingComponent: HudWorkspaceGhost,
})

function JournalPaperPage() {
  const { slug } = Route.useParams()
  const navigate = useNavigate()
  const paper = getJournalPaperBySlug(slug)

  if (!paper) {
    return (
      <div className="font-sans">
        <div className="chitin-card border border-[#ff5540]/60 p-6 sm:p-12 chamfer-corner shadow-2xl text-center">
          <FileText className="w-10 h-10 text-[#ff5540] mx-auto mb-4" />
          <h2 className="font-grotesk font-bold text-xl text-[#dfe3e3] uppercase">
            PAPER NOT FOUND
          </h2>
          <p className="text-xs text-[#839493] mt-2 mb-6 font-sans">
            The requested transmission is not present in the canonical archive. The deep keeps
            only what has been peer-certified.
          </p>
          <button
            onClick={() => navigate({ to: '/journal' })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00c3ff] text-[#030606] font-grotesk font-bold text-xs uppercase chamfer-corner hover:bg-[#38bdf8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to The Benthic Compendium
          </button>
        </div>
      </div>
    )
  }

  return (
    <JournalReaderWorkspace
      papers={INITIAL_JOURNAL_PAPERS}
      activeSlug={paper.slug}
      onNavigate={(nextSlug) => navigate({ to: '/journal/$slug', params: { slug: nextSlug } })}
    />
  )
}
