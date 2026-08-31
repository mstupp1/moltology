import React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { INITIAL_JOURNAL_PAPERS } from '@/lib/journal-data'
import { JournalReaderWorkspace } from '@/components/journal/JournalReaderWorkspace'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'

export const Route = createFileRoute('/_hud/journal/')({
  component: JournalIndexPage,
  pendingComponent: HudWorkspaceGhost,
})

function JournalIndexPage() {
  const navigate = useNavigate()

  return (
    <JournalReaderWorkspace
      papers={INITIAL_JOURNAL_PAPERS}
      showEditorial
      onNavigate={(slug) => navigate({ to: '/journal/$slug', params: { slug } })}
    />
  )
}
